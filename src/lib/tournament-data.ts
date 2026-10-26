import { MATCHES as MATCH_ARRAY, TEAMS as TEAM_ARRAY, TOURNAMENT_CONFIG, VENUES as VENUE_ARRAY } from "@/data/tournament-data";
import type { Stage, Team, TournamentConfig, Venue } from "@/lib/types";

/**
 * Client-safe view of the tournament data module (bundled at build time).
 * The live, always-current values are read from disk with `readTournament()`.
 */
export const STAGE_META: Record<Stage, { label: string; short: string; matches: number }> = {
  r16: { label: "Round of 16", short: "R16", matches: 8 },
  qf: { label: "Quarter-finals", short: "QF", matches: 4 },
  sf: { label: "Semi-finals", short: "SF", matches: 2 },
  final: { label: "Final", short: "F", matches: 1 },
};

export const STAGE_ORDER: Stage[] = ["r16", "qf", "sf", "final"];

export const TOURNAMENT: TournamentConfig = TOURNAMENT_CONFIG;
export const VENUES: Venue[] = VENUE_ARRAY;
export const TEAMS: Team[] = TEAM_ARRAY;
export const MATCHES = MATCH_ARRAY;
export const TEAM_MAP: Record<string, Team> = Object.fromEntries(TEAMS.map((team) => [team.id, team]));
