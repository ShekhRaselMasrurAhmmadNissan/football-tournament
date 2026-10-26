import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";

/**
 * The data store is a plain array of match objects in `src/data/tournament-data.ts`.
 * Saving rewrites those array/object literals in place with `fs`, so the project
 * carries its own data — no database, no JSON file.
 */
export const DATA_FILE = path.join(process.cwd(), "src", "data", "tournament-data.ts");

export interface TournamentFile {
  config: TournamentConfig;
  venues: Venue[];
  teams: Team[];
  matches: Match[];
}

export class StoreError extends Error {}

const HEADER = `/**
 * Tournament data — a plain array of match objects, edited by the /admin portal.
 * No database, no JSON file: this module *is* the store. Every save rewrites the
 * \`matches\` / \`teams\` / \`config\` / \`venues\` declarations below.
 */
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";
`;

const DECLARATIONS = [
  { name: "TOURNAMENT_CONFIG", type: "TournamentConfig", kind: "object" as const },
  { name: "VENUES", type: "Venue[]", kind: "array" as const },
  { name: "TEAMS", type: "Team[]", kind: "array" as const },
  { name: "MATCHES", type: "Match[]", kind: "array" as const },
];

/** Every way the same declaration can legitimately appear. */
function markersFor(name: string): string[] {
  return [`export const ${name}`, `export declare const ${name}`, `export let ${name}`, `const ${name}`];
}

function findDeclaration(source: string, name: string): { from: number; open: string; close: string } | null {
  for (const marker of markersFor(name)) {
    let index = source.indexOf(marker);
    while (index !== -1) {
      // `export const TEAMS: Team[] = [` — the first "=" belongs to the type, so take
      // the LAST "=" before the literal (an `=` inside the annotation is impossible).
      const lineEnd = source.indexOf("\n", index + marker.length);
      let eq = -1;
      for (let at = source.indexOf("=", index + marker.length); at !== -1 && (lineEnd === -1 || at < lineEnd); ) {
        eq = at;
        at = source.indexOf("=", at + 1);
      }
      if (eq !== -1) {
        const scan = (chars: string): number => {
          let best = -1;
          for (const char of chars) {
            const at = source.indexOf(char, eq);
            if (at !== -1 && (best === -1 || at < best)) best = at;
          }
          return best;
        };
        const bracketAt = scan("[");
        const braceAt = scan("{");
        const isObject = braceAt !== -1 && (bracketAt === -1 || braceAt < bracketAt);
        const from = isObject ? braceAt : bracketAt;
        if (from !== -1 && from - eq < 200) {
          return { from, open: isObject ? "{" : "[", close: isObject ? "}" : "]" };
        }
      }
      index = source.indexOf(marker, index + marker.length);
    }
  }
  return null;
}


/**
 * Parses a JS object/array literal as written by a human (unquoted keys,
 * single quotes, trailing commas) and by our own writer (strict JSON).
 */
function parseLiteral(literal: string, label: string): unknown {
  try {
    return JSON.parse(literal) as unknown;
  } catch {
    /* fall through to the tolerant pass */
  }

  try {
    // Drop trailing commas, then quote bare keys: {\n  id: "t1"  }  →  {  "id": "t1" }
    const withoutTrailing = literal.replace(/,(\s*[}\]])/g, "$1");
    const quotedKeys = withoutTrailing.replace(/([{,])(\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1$2"$3"$4');
    return JSON.parse(quotedKeys) as unknown;
  } catch (error) {
    throw new StoreError(`${label} in src/data/tournament-data.ts is not valid data — ${(error as Error).message}`);
  }
}

/** Brace/bracket-aware slice of one literal out of the data file. */
function sliceLiteral(source: string, from: number, open: string, close: string, label: string): unknown {
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
        return parseLiteral(literal, label);
      }
    }
  }

  throw new StoreError(`${label} in src/data/tournament-data.ts is not closed properly.`);
}

/**
 * Strict read used before every write: parses the literals straight out of the
 * file text, so a damaged declaration surfaces as a precise error.
 */
export async function readTournamentStrict(): Promise<TournamentFile> {
  let source: string;
  try {
    source = await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    throw new StoreError(`Cannot open src/data/tournament-data.ts — ${(error as Error).message}`);
  }

  const read = (name: string): unknown => {
    const declaration = findDeclaration(source, name);
    if (!declaration) {
      const seen = DECLARATIONS.map((item) => (findDeclaration(source, item.name) ? item.name : null))
        .filter(Boolean)
        .join(", ");
      throw new StoreError(
        `The data file is missing the ${name} declaration (found: ${seen || "nothing"}). ` +
          `Run "npm run reset-data" to rebuild it, or open /admin and save again.`,
      );
    }
    return sliceLiteral(source, declaration.from, declaration.open, declaration.close, name);
  };

  const matches = read("MATCHES");
  const teams = read("TEAMS");
  const venues = read("VENUES");
  const config = read("TOURNAMENT_CONFIG");

  if (!Array.isArray(matches)) throw new StoreError("MATCHES must be an array.");
  if (!Array.isArray(teams)) throw new StoreError("TEAMS must be an array.");
  if (!Array.isArray(venues)) throw new StoreError("VENUES must be an array.");
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new StoreError("TOURNAMENT_CONFIG must be an object.");
  }

  return {
    config: config as TournamentConfig,
    venues: venues as Venue[],
    teams: teams as Team[],
    matches: matches as Match[],
  };
}

const R16_PAIRS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [3, 14],
  [6, 11],
  [7, 10],
  [2, 15],
];

function kickoffFor(stage: keyof typeof STAGE_META, slot: number, start: string): string {
  const base = new Date(start);
  const offsets: Record<string, number> = { r16: 0, qf: 8, sf: 14, final: 21 };
  const times: Record<string, [number, number]> = {
    r16: [16, 19],
    qf: [17, 20],
    sf: [18, 20],
    final: [19, 19],
  };
  const date = new Date(base);
  date.setDate(base.getDate() + offsets[stage] + Math.floor(slot / 2));
  date.setHours(times[stage][slot % 2], 0, 0, 0);
  return date.toISOString();
}

export function buildBlankBracket(teams: Team[], venues: Venue[], start: string): Match[] {
  const matches: Match[] = [];
  const venueName = (index: number) => venues[index % Math.max(venues.length, 1)]?.name ?? "Main Ground";

  R16_PAIRS.forEach(([homeSeed, awaySeed], index) => {
    matches.push({
      id: `r16-${index + 1}`,
      stage: "r16",
      slot: index + 1,
      homeId: teams[homeSeed - 1]?.id ?? null,
      awayId: teams[awaySeed - 1]?.id ?? null,
      homeScore: null,
      awayScore: null,
      homePens: null,
      awayPens: null,
      status: "scheduled",
      kickoff: kickoffFor("r16", index, start),
      venue: venueName(index),
      minute: 0,
      goals: [],
      cards: [],
      homeFrom: null,
      awayFrom: null,
    });
  });

  const plan = [
    { stage: "qf" as const, count: 4, from: "r16" },
    { stage: "sf" as const, count: 2, from: "qf" },
    { stage: "final" as const, count: 1, from: "sf" },
  ];

  plan.forEach(({ stage, count, from }) => {
    for (let slot = 1; slot <= count; slot += 1) {
      matches.push({
        id: `${stage}-${slot}`,
        stage,
        slot,
        homeId: null,
        awayId: null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: "scheduled",
        kickoff: kickoffFor(stage, slot - 1, start),
        venue: venueName(slot),
        minute: 0,
        goals: [],
        cards: [],
        homeFrom: `${from}-${slot * 2 - 1}`,
        awayFrom: `${from}-${slot * 2}`,
      });
    }
  });

  return matches;
}

function assertData(data: TournamentFile): TournamentFile {
  if (!data) throw new StoreError("The tournament data module is empty.");
  if (!Array.isArray(data.teams) || data.teams.length === 0) {
    throw new StoreError("No teams found in src/data/tournament-data.ts");
  }
  if (!Array.isArray(data.matches)) throw new StoreError("matches must be an array.");
  if (data.matches.length !== 15) {
    data.matches = buildBlankBracket(data.teams, data.venues ?? [], data.config?.kickoff ?? new Date().toISOString());
  }
  return data;
}

/**
 * Lenient read for rendering pages: if the file is damaged, fall back to a fresh
 * bracket instead of breaking the public site.
 */
export async function readTournament(): Promise<TournamentFile> {
  try {
    return assertData(await readTournamentStrict());
  } catch {
    const fallbackConfig: TournamentConfig = {
      name: "Magura Golden Cup",
      edition: "2026",
      organiser: "Magura Golden Football Club",
      kickoff: new Date().toISOString(),
      finalDate: new Date().toISOString(),
      prizePool: 0,
      format: "16 teams · Single elimination",
    };
    const source = await fs.readFile(DATA_FILE, "utf8").catch(() => "");
    const teams = (() => {
      try {
        const declaration = findDeclaration(source, "TEAMS");
        if (declaration) return sliceLiteral(source, declaration.from, declaration.open, declaration.close, "TEAMS") as Team[];
      } catch {
        /* ignore */
      }
      return [] as Team[];
    })();
    const venues = (() => {
      try {
        const declaration = findDeclaration(source, "VENUES");
        if (declaration) return sliceLiteral(source, declaration.from, declaration.open, declaration.close, "VENUES") as Venue[];
      } catch {
        /* ignore */
      }
      return [] as Venue[];
    })();

    return {
      config: fallbackConfig,
      venues,
      teams,
      matches: buildBlankBracket(teams, venues, fallbackConfig.kickoff),
    };
  }
}

function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.slot - b.slot,
  );
}

function literal(name: string, type: string, value: unknown): string {
  return `export const ${name}: ${type} = ${JSON.stringify(value, null, 2)};\n`;
}

/** Same output, but with numeric indices only — JSON is valid JS, so this is safe. */


/** Serialise the whole store — also used by `npm run reset-data`. */
export function serialise(data: TournamentFile): string {
  return [
    HEADER,
    literal("TOURNAMENT_CONFIG", "TournamentConfig", data.config),
    literal("VENUES", "Venue[]", data.venues),
    literal("TEAMS", "Team[]", data.teams),
    literal("MATCHES", "Match[]", sortMatches(data.matches)),
  ].join("\n");
}

export async function writeTournament(data: TournamentFile): Promise<void> {
  const source = serialise(data);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fs.writeFile(DATA_FILE, source, "utf8");
      return;
    } catch (error) {
      lastError = error as Error;
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
    }
  }

  throw new StoreError(
    `Could not write src/data/tournament-data.ts — ${lastError?.message ?? "unknown error"}. Check that the file is not read-only or locked.`,
  );
}

export type { Match, Team, TournamentConfig, Venue };

/**
 * Write-path loader: if the data file is damaged (missing declaration, bad JSON),
 * rebuild it from whatever can be recovered and carry on — the admin never gets stuck.
 */
export async function loadOrRepair(): Promise<TournamentFile> {
  try {
    return assertData(await readTournamentStrict());
  } catch (readError) {
    const recovered = await readTournament();
    try {
      await writeTournament(recovered);
    } catch {
      throw readError instanceof StoreError ? readError : new StoreError((readError as Error).message);
    }
    return recovered;
  }
}
