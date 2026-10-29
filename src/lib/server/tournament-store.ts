import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient, type Collection, type Db, type MongoClientOptions } from "mongodb";
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";
import { STAGE_ORDER } from "@/lib/stages";

export class StoreError extends Error {}

const DEFAULT_URI = "mongodb://127.0.0.1:27017";
const DEFAULT_DB = "magura_golden_cup";

export const FIXED_VENUE = "Magura Govt. Primary School Play Ground";
export const MAX_TEAMS = 16;

export const ROUND_LIMITS: Record<Match["stage"], number> = { r16: 8, qf: 4, sf: 2, final: 1 };

const COLLECTIONS = {
  config: "tournament_config",
  venues: "tournament_venues",
  teams: "tournament_teams",
  matches: "tournament_matches",
} as const;

export interface TournamentFile {
  config: TournamentConfig;
  venues: Venue[];
  teams: Team[];
  matches: Match[];
}

declare global {
  var __maguraMongo: { client: MongoClient; promise: Promise<MongoClient> } | undefined;
}

function uri(): string {
  const value = process.env.MONGODB_URI?.trim();
  return value && value.length > 0 ? value : DEFAULT_URI;
}

function dbName(): string {
  const explicit = process.env.MONGODB_DB?.trim();
  if (explicit) return explicit;
  try {
    const path = new URL(uri()).pathname.replace(/^\//, "");
    return path || DEFAULT_DB;
  } catch {
    return DEFAULT_DB;
  }
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  maxPoolSize: 10,
};

/** One pooled client per process — never call `connect()` per request. */
export async function getClient(): Promise<MongoClient> {
  if (!global.__maguraMongo) {
    const client = new MongoClient(uri(), options);
    global.__maguraMongo = { client, promise: client.connect() };
  }
  try {
    return await global.__maguraMongo.promise;
  } catch (error) {
    global.__maguraMongo = undefined;
    throw new StoreError(
      `Cannot reach MongoDB at ${uri()} — ${(error as Error).message}. ` +
        `Set MONGODB_URI in .env.local (or start mongod locally).`,
    );
  }
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName());
}

async function collection<T extends object>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

/* ------------------------------------------------------------------ */
/* Documents                                                          */
/* ------------------------------------------------------------------ */

type ConfigDoc = TournamentConfig & { _id: "config" };
type ConfigInsert = TournamentConfig;

type VenueDoc = Omit<Venue, "id"> & { _id: string };

type TeamDoc = Omit<Team, "id"> & { _id: string };

type MatchDoc = Omit<Match, "id"> & { _id: string; order: number };

function matchOrder(match: Match): number {
  return STAGE_ORDER.indexOf(match.stage) * 100 + match.slot;
}

/** Accepts old auto-bracket documents and returns the manual-scheduling shape. */
function cleanMatch(doc: Record<string, unknown>, fallbackId: string): Match {
  const get = (key: string): string | null => {
    const value = doc[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  const getNum = (key: string): number | null => {
    const value = doc[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };
  const stage = (typeof doc.stage === "string" && (STAGE_ORDER as string[]).includes(doc.stage)
    ? doc.stage
    : "r16") as Match["stage"];
  const rawStatus = typeof doc.status === "string" ? doc.status : "scheduled";
  const status: Match["status"] =
    rawStatus === "completed" || rawStatus === "finished"
      ? "completed"
      : rawStatus === "postponed"
        ? "postponed"
        : rawStatus === "cancelled"
          ? "cancelled"
          : "scheduled";

  // Old field names → neutral teamA/teamB. Manual picks always win.
  const teamAId = get("teamAId") ?? get("homeId");
  const teamBId = get("teamBId") ?? get("awayId");

  const winnerRaw = get("winnerId");
  const winnerId = winnerRaw === teamAId || winnerRaw === teamBId ? winnerRaw : null;

  const needsReview = doc.needsReview === true;
  const reviewNote = typeof doc.reviewNote === "string" && doc.reviewNote.length > 0 ? doc.reviewNote : null;

  const decided = status === "completed" && winnerId !== null;

  return {
    id: typeof doc._id === "string" ? doc._id : fallbackId,
    stage,
    slot: typeof doc.slot === "number" && Number.isFinite(doc.slot) ? doc.slot : 1,
    teamAId,
    teamBId,
    teamAScore: getNum("teamAScore") ?? getNum("homeScore"),
    teamBScore: getNum("teamBScore") ?? getNum("awayScore"),
    teamAPens: getNum("teamAPens") ?? getNum("homePens"),
    teamBPens: getNum("teamBPens") ?? getNum("awayPens"),
    winnerId: decided ? winnerId : null,
    status: decided ? status : status === "completed" && !winnerId ? "scheduled" : status,
    kickoff: typeof doc.kickoff === "string" ? (doc.kickoff as string) : null,
    venue: FIXED_VENUE,
    minute: typeof doc.minute === "number" && Number.isFinite(doc.minute) ? doc.minute : 0,
    goals: Array.isArray(doc.goals) ? (doc.goals as Match["goals"]) : [],
    cards: Array.isArray(doc.cards) ? (doc.cards as Match["cards"]) : [],
    needsReview,
    reviewNote,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

export async function readTournament(options: { seedIfEmpty?: boolean } = { seedIfEmpty: true }): Promise<TournamentFile> {
  try {
    const [configs, venues, teams, matches] = await Promise.all([
      collection<ConfigDoc>(COLLECTIONS.config).then((c) => c.findOne({ _id: "config" })),
      collection<VenueDoc>(COLLECTIONS.venues).then((c) => c.find({}).sort({ _id: 1 }).toArray()),
      collection<TeamDoc>(COLLECTIONS.teams).then((c) => c.find({}).sort({ _id: 1 }).toArray()),
      collection<MatchDoc>(COLLECTIONS.matches).then((c) => c.find({}).sort({ order: 1 }).toArray()),
    ]);

    if (!configs) {
      if (options.seedIfEmpty !== false) {
        await ensureSeeded();
        return readTournament({ seedIfEmpty: false });
      }
      throw new StoreError(
        `The MongoDB database "${dbName()}" is empty. Run "npm run seed" to load the starting data.`,
      );
    }

    const cleanTeams: Team[] = teams.map(({ _id, ...team }) => ({ ...team, id: _id }));
    const cleanVenues: Venue[] = venues.map(({ _id, ...venue }) => ({ ...venue, id: _id }));
    const cleanMatches: Match[] = matches.map((doc) =>
      cleanMatch(doc as unknown as Record<string, unknown>, doc._id),
    );

    const { _id, ...config } = configs;
    void _id;

    const withDefaults: TournamentConfig = {
      ...(config as TournamentConfig),
      awards: (config as TournamentConfig).awards ?? [],
      championPrize: Number((config as TournamentConfig).championPrize ?? 50000),
      runnerUpPrize: Number((config as TournamentConfig).runnerUpPrize ?? 40000),
      venue: FIXED_VENUE,
    };

    return {
      config: withDefaults,
      venues: cleanVenues.length ? cleanVenues : [{ id: "v1", name: FIXED_VENUE, city: "Magura", capacity: 0, surface: "" }],
      teams: cleanTeams,
      matches: cleanMatches,
    };
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError(`Could not read the tournament from MongoDB — ${(error as Error).message}`);
  }
}

/* ------------------------------------------------------------------ */
/* Knockout rules (server-side, single source of truth)               */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  matchId: string;
  message: string;
}

/** Stage ordering helper: r16 < qf < sf < final */
export function stageRank(stage: Match["stage"]): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Teams with a confirmed win in the given stage. */
function winnersInStage(matches: Match[], stage: Match["stage"]): Set<string> {
  const winners = new Set<string>();
  matches.forEach((match) => {
    if (match.stage === stage && match.status === "completed" && match.winnerId) winners.add(match.winnerId);
  });
  return winners;
}

/** All teams eliminated by a confirmed loss in a *different* match. */
export function eliminatedTeams(matches: Match[], exceptMatchId?: string): Set<string> {
  const eliminated = new Set<string>();
  matches.forEach((match) => {
    if (match.id === exceptMatchId) return;
    if (match.status !== "completed" || !match.winnerId || !match.teamAId || !match.teamBId) return;
    const loser = match.winnerId === match.teamAId ? match.teamBId : match.winnerId === match.teamBId ? match.teamAId : null;
    if (loser) eliminated.add(loser);
  });
  return eliminated;
}

/** Is this team allowed to appear in this stage at all? */
export function isEligibleForStage(teamId: string, stage: Match["stage"], matches: Match[]): boolean {
  if (stage === "r16") return true;
  const previous: Match["stage"] = stage === "qf" ? "r16" : stage === "sf" ? "qf" : "sf";
  return winnersInStage(matches, previous).has(teamId);
}

/**
 * Validate one manually scheduled match against every knockout rule.
 * Returns a list of human-readable problems (empty = valid).
 */
export function validateMatch(match: Match, allMatches: Match[], teamIds: Set<string>): string[] {
  const problems: string[] = [];

  if (!(STAGE_ORDER as string[]).includes(match.stage)) {
    problems.push("Round is invalid. Pick Round of 16, Quarter-final, Semi-final or Final.");
    return problems;
  }

  const { teamAId, teamBId } = match;

  if (!teamAId || !teamBId) return problems; // unassigned slots are allowed — they render as TBA
  if (teamAId === teamBId) problems.push("A team cannot play itself — pick two different teams.");
  if (!teamIds.has(teamAId)) problems.push("First team is not a registered tournament team.");
  if (!teamIds.has(teamBId)) problems.push("Second team is not a registered tournament team.");

  const eliminated = eliminatedTeams(allMatches, match.id);
  if (eliminated.has(teamAId)) problems.push("This team was eliminated and cannot enter another match without an authorised correction.");
  if (teamBId !== teamAId && eliminated.has(teamBId)) problems.push("This team was eliminated and cannot enter another match without an authorised correction.");

  // No conflicting assignment in the same round.
  allMatches.forEach((other) => {
    if (other.id === match.id || other.stage !== match.stage || other.status === "cancelled") return;
    if (!other.teamAId || !other.teamBId) return;
    const clash =
      other.teamAId === teamAId || other.teamBId === teamAId || other.teamAId === teamBId || other.teamBId === teamBId;
    if (clash) problems.push(`Conflicts with ${other.id.toUpperCase()}: a team cannot play two ties in the same round.`);
  });

  if (!isEligibleForStage(teamAId, match.stage, allMatches)) {
    problems.push("First team has no confirmed win in the previous round yet.");
  }
  if (!isEligibleForStage(teamBId, match.stage, allMatches)) {
    problems.push("Second team has no confirmed win in the previous round yet.");
  }

  // Score / winner consistency.
  const a = match.teamAScore;
  const b = match.teamBScore;
  if (match.winnerId) {
    if (match.winnerId !== teamAId && match.winnerId !== teamBId) {
      problems.push("Winner must be one of the two teams in this match.");
    }
    if (a === null || b === null) {
      problems.push("Enter both scores before confirming the winner.");
    } else if (a > b && match.winnerId !== teamAId) {
      problems.push("Scores say the first team won — the winner must match the scoreline.");
    } else if (b > a && match.winnerId !== teamBId) {
      problems.push("Scores say the second team won — the winner must match the scoreline.");
    } else if (a === b) {
      if (match.teamAPens === null || match.teamBPens === null) {
        problems.push("A level tie needs a shootout score before the winner can be confirmed.");
      } else if (match.teamAPens === match.teamBPens) {
        problems.push("A shootout cannot end level.");
      } else if (match.teamAPens > match.teamBPens && match.winnerId !== teamAId) {
        problems.push("Shootout says the first team won — the winner must match.");
      } else if (match.teamBPens > match.teamAPens && match.winnerId !== teamBId) {
        problems.push("Shootout says the second team won — the winner must match.");
      }
    }
    if (match.status !== "completed") problems.push("Confirming a winner marks the match completed.");
  }

  if ((match.status === "cancelled" || match.status === "postponed") && match.winnerId) {
    problems.push("A cancelled or postponed match cannot have a confirmed winner.");
  }

  return problems;
}

/**
 * When a confirmed result changes, flag later ties that used the old winner
 * instead of silently rewriting them. Returns the flagged match ids.
 * Downstream ties are exempt from the usual validity check — they are the
 * thing being flagged, not something to be rejected.
 */
export function flagAffectedDownstream(previous: Match[], next: Match[]): { id: string; note: string }[] {
  const flags: { id: string; note: string }[] = [];
  const prevById = new Map(previous.map((match) => [match.id, match]));

  next.forEach((match) => {
    const prev = prevById.get(match.id);
    if (!prev || prev.winnerId === match.winnerId) return;
    if (!prev.winnerId || prev.status !== "completed") return;
    // The old winner changed (or was cleared) — find later ties still naming it.
    const stale = prev.winnerId;
    next.forEach((later) => {
      if (later.id === match.id) return;
      if (stageRank(later.stage) <= stageRank(match.stage)) return;
      if (later.status === "cancelled") return;
      if (later.teamAId === stale || later.teamBId === stale) {
        flags.push({
          id: later.id,
          note: `Winner of ${match.id.toUpperCase()} changed — re-check this tie's participants.`,
        });
      }
    });
  });

  return flags;
}

/**
 * Validate the whole bracket. A save may legitimately include a downstream tie
 * that contradicts the corrected result — that is exactly what "flag for
 * review" is for. So validation runs twice:
 *   1. validate everything strictly;
 *   2. drop every problem raised on a tie the corrected results flag,
 *      as long as the problem is about eligibility/elimination/conflict.
 * A save is rejected only when a non-flagged tie (or a tie with a genuinely
 * broken scoreline/winner) complains.
 */
export function validateBracket(previous: Match[], matches: Match[], teamIds: Set<string>): string[] {
  const allProblems: string[] = [];
  const perMatch = new Map<string, string[]>();
  matches.forEach((match) => {
    const problems = validateMatch(match, matches, teamIds);
    if (problems.length) {
      perMatch.set(match.id, problems);
      problems.forEach((problem) => allProblems.push(`${match.id.toUpperCase()}: ${problem}`));
    }
  });
  if (allProblems.length === 0) return [];

  const flags = flagAffectedDownstream(previous, matches);
  if (!flags.length) return allProblems;

  const flaggedIds = new Set(flags.map((flag) => flag.id));
  const SOFT = ["eliminated", "no confirmed win", "Conflicts"];
  const hard = allProblems.filter((problem) => {
    const id = problem.split(":")[0].toLowerCase();
    const soft = SOFT.some((fragment) => problem.includes(fragment));
    return !(soft && flaggedIds.has(id));
  });
  return hard;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

async function replaceMatches(matches: Match[]): Promise<void> {
  const col = await collection<MatchDoc>(COLLECTIONS.matches);
  const sorted = [...matches].sort((a, b) => matchOrder(a) - matchOrder(b));
  const ids = sorted.map((match) => match.id);

  if (sorted.length) {
    await col.bulkWrite(
      sorted.map((match) => {
        const { id, ...rest } = match;
        const replacement = { _id: id, ...rest, order: matchOrder(match) } as MatchDoc;
        return { replaceOne: { filter: { _id: id }, replacement, upsert: true } };
      }),
      { ordered: false },
    );
  }
  await col.deleteMany({ _id: { $nin: ids } });
}

/** Save the whole bracket after strict validation. Applies downstream review flags. */
export async function saveMatches(matches: Match[]): Promise<{ matches: Match[]; flagged: string[] }> {
  try {
    if (matches.length > 15) throw new StoreError("The tournament has at most 15 matches.");

    const ids = new Set(matches.map((match) => match.id));
    if (ids.size !== matches.length) throw new StoreError("Two matches share the same id.");

    const data = await readTournament({ seedIfEmpty: false });
    const teamIds = new Set(data.teams.map((team) => team.id));

    const allProblems = validateBracket(data.matches, matches, teamIds);
    if (allProblems.length > 0) throw new StoreError(allProblems.slice(0, 4).join(" "));

    const flags = flagAffectedDownstream(data.matches, matches);
    const withFlags = matches.map((match) => {
      const flag = flags.find((item) => item.id === match.id);
      if (!flag) return match;
      return { ...match, needsReview: true, reviewNote: flag.note };
    });

    await replaceMatches(withFlags);
    return { matches: withFlags, flagged: flags.map((flag) => flag.id) };
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError(`Could not save the matches to MongoDB — ${(error as Error).message}`);
  }
}

/** Save one match by id after the same strict validation. */
export async function saveOneMatch(match: Match): Promise<{ match: Match; flagged: string[] }> {
  const data = await readTournament({ seedIfEmpty: false });
  const teamIds = new Set(data.teams.map((team) => team.id));
  const merged = data.matches.some((item) => item.id === match.id)
    ? data.matches.map((item) => (item.id === match.id ? { ...match, venue: FIXED_VENUE } : item))
    : [...data.matches, { ...match, venue: FIXED_VENUE }];

  if (merged.length > 15) throw new StoreError("The tournament has at most 15 matches.");

  const problems = validateMatch({ ...match, venue: FIXED_VENUE }, merged, teamIds);
  if (problems.length > 0) throw new StoreError(problems.slice(0, 3).join(" "));

  const { matches, flagged } = await saveMatches(merged);
  const saved = matches.find((item) => item.id === match.id);
  if (!saved) throw new StoreError("Match was not saved.");
  return { match: saved, flagged };
}

/** Reset one slot back to "to be announced" without deleting the slot. */
export async function clearMatch(matchId: string): Promise<Match> {
  const data = await readTournament({ seedIfEmpty: false });
  const target = data.matches.find((match) => match.id === matchId);
  if (!target) throw new StoreError("Match not found.");
  if (target.status === "completed") {
    // Clearing a confirmed result may invalidate downstream picks — flag them.
    const cleared: Match = {
      ...target,
      teamAScore: null,
      teamBScore: null,
      teamAPens: null,
      teamBPens: null,
      winnerId: null,
      status: "scheduled",
      minute: 0,
      goals: [],
      cards: [],
      needsReview: false,
      reviewNote: null,
    };
    const { match } = await saveOneMatch(cleared);
    return match;
  }
  const cleared: Match = {
    ...target,
    teamAId: null,
    teamBId: null,
    teamAScore: null,
    teamBScore: null,
    teamAPens: null,
    teamBPens: null,
    winnerId: null,
    status: "scheduled",
    minute: 0,
    goals: [],
    cards: [],
    kickoff: null,
    needsReview: false,
    reviewNote: null,
  };
  const merged = data.matches.map((item) => (item.id === matchId ? cleared : item));
  await replaceMatches(merged);
  return cleared;
}

/** Delete a slot's manual assignment (same as clearing — slots are fixed). */
export async function deleteMatch(matchId: string): Promise<void> {
  await clearMatch(matchId);
}

export async function saveTeams(teams: Team[]): Promise<void> {
  try {
    if (teams.length > MAX_TEAMS) {
      throw new StoreError(`Only ${MAX_TEAMS} teams are allowed — remove one before adding another.`);
    }
    const ids = new Set(teams.map((team) => team.id));
    if (ids.size !== teams.length) throw new StoreError("Two teams share the same id.");

    const col = await collection<TeamDoc>(COLLECTIONS.teams);
    if (teams.length) {
      await col.bulkWrite(
        teams.map((team) => {
          const { id, ...rest } = team;
          const replacement = { _id: id, ...rest } as TeamDoc;
          return { replaceOne: { filter: { _id: id }, replacement, upsert: true } };
        }),
        { ordered: false },
      );
    }
    await col.deleteMany({ _id: { $nin: [...ids] } });
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError(`Could not save the teams to MongoDB — ${(error as Error).message}`);
  }
}

/** Remove a team only if no confirmed result depends on it. */
export async function removeTeam(teamId: string): Promise<void> {
  const data = await readTournament({ seedIfEmpty: false });
  const used = data.matches.filter(
    (match) =>
      (match.teamAId === teamId || match.teamBId === teamId) &&
      (match.status === "completed" || match.winnerId !== null),
  );
  if (used.length > 0) {
    throw new StoreError(
      `${teamId.toUpperCase()} has confirmed results (${used.map((match) => match.id.toUpperCase()).join(", ")}). Correct those results first — the team cannot simply be deleted.`,
    );
  }
  const remaining = data.teams.filter((team) => team.id !== teamId);
  const matches = data.matches.map((match) => ({
    ...match,
    teamAId: match.teamAId === teamId ? null : match.teamAId,
    teamBId: match.teamBId === teamId ? null : match.teamBId,
  }));
  await saveTeams(remaining);
  await replaceMatches(matches);
}

export async function saveConfig(config: TournamentConfig, venues: Venue[]): Promise<void> {
  try {
    const safe: TournamentConfig = {
      ...config,
      venue: FIXED_VENUE,
      championPrize: Number.isFinite(Number(config.championPrize)) ? Number(config.championPrize) : 50000,
      runnerUpPrize: Number.isFinite(Number(config.runnerUpPrize)) ? Number(config.runnerUpPrize) : 40000,
      awards: Array.isArray(config.awards) ? config.awards : [],
    };
    const configDoc: ConfigInsert = { ...safe };
    await collection<ConfigDoc>(COLLECTIONS.config).then((c) =>
      c.replaceOne({ _id: "config" }, configDoc, { upsert: true }),
    );

    // Single fixed venue — the collection always holds exactly this ground.
    const col = await collection<VenueDoc>(COLLECTIONS.venues);
    const fixed: VenueDoc = {
      _id: "v1",
      name: FIXED_VENUE,
      city: "Magura",
      capacity: Number.isFinite(Number(venues[0]?.capacity)) ? Number(venues[0]?.capacity) : 0,
      surface: typeof venues[0]?.surface === "string" ? venues[0]?.surface : "",
    };
    await col.replaceOne({ _id: "v1" }, fixed, { upsert: true });
    await col.deleteMany({ _id: { $ne: "v1" } });
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError(`Could not save the tournament settings to MongoDB — ${(error as Error).message}`);
  }
}

/* ------------------------------------------------------------------ */
/* Seed                                                               */
/* ------------------------------------------------------------------ */

const SOURCE_FILE = path.join(process.cwd(), "src", "data", "tournament-data.ts");

/** Reads one declaration out of the bundled starting-data module. */
function readDeclaration(source: string, name: string): unknown {
  const marker = `export const ${name}`;
  const index = source.indexOf(marker);
  if (index < 0) return null;

  const lineEnd = source.indexOf("\n", index + marker.length);
  let eq = -1;
  for (let at = source.indexOf("=", index + marker.length); at !== -1 && (lineEnd === -1 || at < lineEnd); ) {
    eq = at;
    at = source.indexOf("=", at + 1);
  }
  if (eq === -1) return null;

  const bracket = source.indexOf("[", eq);
  const brace = source.indexOf("{", eq);
  const isObject = brace !== -1 && (bracket === -1 || brace < bracket);
  const from = isObject ? brace : bracket;
  const open = isObject ? "{" : "[";
  const close = isObject ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = from; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(from, i + 1);
        try {
          return JSON.parse(literal) as unknown;
        } catch {
          const tolerant = literal
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/([{,])(\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1$2"$3"$4');
          return JSON.parse(tolerant) as unknown;
        }
      }
    }
  }
  return null;
}

export async function readStartingData(): Promise<TournamentFile> {
  const source = await readFile(SOURCE_FILE, "utf8").catch(() => "");
  const config = readDeclaration(source, "TOURNAMENT_CONFIG");
  const venues = readDeclaration(source, "VENUES");
  const teams = readDeclaration(source, "TEAMS");
  const matches = readDeclaration(source, "MATCHES");

  if (!config || !Array.isArray(teams) || teams.length === 0) {
    throw new StoreError("src/data/tournament-data.ts does not contain usable starting data.");
  }

  return {
    config: {
      ...(config as TournamentConfig),
      awards: (config as TournamentConfig).awards ?? [],
      championPrize: Number((config as TournamentConfig).championPrize ?? 50000),
      runnerUpPrize: Number((config as TournamentConfig).runnerUpPrize ?? 40000),
      venue: FIXED_VENUE,
    },
    venues: (((venues as Venue[]) ?? []) as Venue[]).slice(0, 1).map((venue, index) => ({
      ...venue,
      id: venue.id ?? `v${index + 1}`,
      name: FIXED_VENUE,
    })),
    teams: teams as Team[],
    matches: (((matches as Match[]) ?? []) as Match[]).slice(0, 15).map((match) => ({
      ...cleanMatch(match as unknown as Record<string, unknown>, match.id),
      venue: FIXED_VENUE,
    })),
  };
}

/** Fills an empty database from the bundled data. Safe to call on every read. */
export async function ensureSeeded(): Promise<boolean> {
  if (!(await isDatabaseEmpty())) return false;
  const starting = await readStartingData();
  await seedDatabase(starting);
  return true;
}

export async function dropAll(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection(COLLECTIONS.config).deleteMany({}),
    db.collection(COLLECTIONS.venues).deleteMany({}),
    db.collection(COLLECTIONS.teams).deleteMany({}),
    db.collection(COLLECTIONS.matches).deleteMany({}),
  ]);
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const col = await collection<ConfigDoc>(COLLECTIONS.config);
  const found = await col.countDocuments({}, { limit: 1 });
  return found === 0;
}

export async function seedDatabase(data: TournamentFile): Promise<void> {
  await dropAll();
  const configDoc: ConfigInsert = { ...data.config, venue: FIXED_VENUE };
  await collection<ConfigDoc>(COLLECTIONS.config).then((c) =>
    c.replaceOne({ _id: "config" }, configDoc, { upsert: true }),
  );
  await saveTeams(data.teams);
  await saveConfig(data.config, data.venues);

  // Seed stores raw slots; validation runs on every admin save, not on seed.
  const col = await collection<MatchDoc>(COLLECTIONS.matches);
  await col.bulkWrite(
    data.matches.map((match) => {
      const { id, ...rest } = match;
      const replacement = { _id: id, ...rest, venue: FIXED_VENUE, order: matchOrder(match as Match) } as MatchDoc;
      return { replaceOne: { filter: { _id: id }, replacement, upsert: true } };
    }),
    { ordered: false },
  );
}

/** Write-path loader: read the tournament, failing loudly when the DB is empty. */
export async function loadOrRepair(): Promise<TournamentFile> {
  return readTournament({ seedIfEmpty: true });
}

export async function closeClient(): Promise<void> {
  const cached = global.__maguraMongo;
  global.__maguraMongo = undefined;
  if (cached) await cached.client.close().catch(() => undefined);
}

export type { Match, Team, TournamentConfig, Venue };
