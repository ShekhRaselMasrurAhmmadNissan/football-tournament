import type { Match, Player, Team } from "@/lib/types";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";

export function getTeam(teams: Team[], id: string | null): Team | null {
  if (!id) return null;
  return teams.find((team) => team.id === id) ?? null;
}

export function isDecided(match: Match): boolean {
  return match.status === "finished" && match.homeScore !== null && match.awayScore !== null;
}

/** Winner id of a finished match, accounting for penalty shootouts. */
export function winnerOf(match: Match): string | null {
  if (!isDecided(match) || !match.homeId || !match.awayId) return null;
  const home = match.homeScore as number;
  const away = match.awayScore as number;
  if (home > away) return match.homeId;
  if (away > home) return match.awayId;
  if (match.homePens !== null && match.awayPens !== null) {
    if (match.homePens > match.awayPens) return match.homeId;
    if (match.awayPens > match.homePens) return match.awayId;
  }
  return null;
}

export function loserOf(match: Match): string | null {
  const winner = winnerOf(match);
  if (!winner) return null;
  return winner === match.homeId ? match.awayId : match.homeId;
}

/** Rebuilds the whole bracket: every later match inherits its winners from the feeders. */
export function resolveBracket(matches: Match[]): Match[] {
  const byId = new Map(matches.map((match) => [match.id, { ...match }]));

  STAGE_ORDER.forEach((stage) => {
    if (stage === "r16") return;
    byId.forEach((match, key) => {
      if (match.stage !== stage) return;
      const home = match.homeFrom ? byId.get(match.homeFrom) : null;
      const away = match.awayFrom ? byId.get(match.awayFrom) : null;
      const nextHome = home ? winnerOf(home) : match.homeId;
      const nextAway = away ? winnerOf(away) : match.awayId;

      if (nextHome !== match.homeId || nextAway !== match.awayId) {
        byId.set(key, {
          ...match,
          homeId: nextHome,
          awayId: nextAway,
          homeScore: null,
          awayScore: null,
          homePens: null,
          awayPens: null,
          status: "scheduled",
          minute: 0,
          goals: [],
          cards: [],
        });
      }
    });
  });

  return matches.map((match) => byId.get(match.id) ?? match);
}

export function championOf(matches: Match[]): string | null {
  const final = matches.find((match) => match.stage === "final");
  return final ? winnerOf(final) : null;
}

export interface TeamRecord {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  cleanSheets: number;
  eliminated: boolean;
  stage: string;
}

export function teamRecords(matches: Match[], teams: Team[]): TeamRecord[] {
  const records = new Map<string, TeamRecord>();
  teams.forEach((team) => {
    records.set(team.id, {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      cleanSheets: 0,
      eliminated: false,
      stage: STAGE_META.r16.label,
    });
  });

  matches.forEach((match) => {
    if (!isDecided(match) || !match.homeId || !match.awayId) return;
    const home = records.get(match.homeId);
    const away = records.get(match.awayId);
    if (!home || !away) return;
    const hs = match.homeScore as number;
    const as = match.awayScore as number;
    const winner = winnerOf(match);

    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;
    if (as === 0) home.cleanSheets += 1;
    if (hs === 0) away.cleanSheets += 1;

    if (winner === match.homeId) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
      away.eliminated = true;
    } else if (winner === match.awayId) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
      home.eliminated = true;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  matches.forEach((match) => {
    if (!isDecided(match)) return;
    const stageLabel = STAGE_META[match.stage].label;
    const winner = winnerOf(match);
    if (!winner) return;
    const record = records.get(winner);
    if (record) record.stage = stageLabel;
  });

  return Array.from(records.values())
    .map((record) => ({ ...record, goalDiff: record.goalsFor - record.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        (getTeam(teams, a.teamId)?.name ?? "").localeCompare(getTeam(teams, b.teamId)?.name ?? ""),
    );
}

export interface ScorerRow {
  player: string;
  teamId: string;
  goals: number;
  penalties: number;
}

export function topScorers(matches: Match[]): ScorerRow[] {
  const table = new Map<string, ScorerRow>();
  matches.forEach((match) => {
    if (!isDecided(match)) return;
    match.goals.forEach((goal) => {
      const key = `${goal.teamId}:${goal.scorer}`;
      const row = table.get(key) ?? { player: goal.scorer, teamId: goal.teamId, goals: 0, penalties: 0 };
      row.goals += 1;
      table.set(key, row);
    });
  });
  return Array.from(table.values()).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
}

export function findPlayer(teams: Team[], teamId: string, name: string): Player | undefined {
  return teams.find((team) => team.id === teamId)?.squad.find((player) => player.name === name);
}

export interface TournamentSummary {
  totalMatches: number;
  played: number;
  remaining: number;
  goals: number;
  avgGoals: number;
  cleanSheets: number;
  shootouts: number;
  biggestWin: Match | null;
  progress: number;
}

export function summarise(matches: Match[]): TournamentSummary {
  const playedMatches = matches.filter(isDecided);
  const goals = playedMatches.reduce((sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0);
  const cleanSheets = playedMatches.filter(
    (match) => match.homeScore === 0 || match.awayScore === 0,
  ).length;
  const shootouts = playedMatches.filter((match) => match.homePens !== null).length;

  let biggestWin: Match | null = null;
  let margin = -1;
  playedMatches.forEach((match) => {
    const diff = Math.abs((match.homeScore ?? 0) - (match.awayScore ?? 0));
    if (diff > margin) {
      margin = diff;
      biggestWin = match;
    }
  });

  return {
    totalMatches: matches.length,
    played: playedMatches.length,
    remaining: matches.length - playedMatches.length,
    goals,
    avgGoals: playedMatches.length ? Number((goals / playedMatches.length).toFixed(2)) : 0,
    cleanSheets,
    shootouts,
    biggestWin,
    progress: matches.length ? Math.round((playedMatches.length / matches.length) * 100) : 0,
  };
}

export function stageMatches(matches: Match[], stage: Match["stage"]): Match[] {
  return matches
    .filter((match) => match.stage === stage)
    .sort((a, b) => a.slot - b.slot);
}

export function sortedByKickoff(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const aTime = a.kickoff ? new Date(a.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.kickoff ? new Date(b.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime || a.slot - b.slot;
  });
}

export function formatKickoff(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dhaka",
  });
}

export function formatDay(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Dhaka",
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dhaka",
  });
}

export function scoreline(match: Match): string {
  if (match.homeScore === null || match.awayScore === null) return "vs";
  const base = `${match.homeScore} - ${match.awayScore}`;
  if (match.homePens !== null && match.awayPens !== null) {
    return `${base} (${match.homePens}-${match.awayPens} p)`;
  }
  return base;
}
