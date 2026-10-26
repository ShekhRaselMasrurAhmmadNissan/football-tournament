export type Stage = "r16" | "qf" | "sf" | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  shirt: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  manager: string;
  founded: number;
  primary: string;
  accent: string;
  crest: string;
  squad: Player[];
}

export interface Goal {
  id: string;
  minute: number;
  scorer: string;
  teamId: string;
}

export interface Card {
  id: string;
  minute: number;
  player: string;
  teamId: string;
  type: "yellow" | "red";
}

export interface Match {
  id: string;
  stage: Stage;
  slot: number;
  /** null until the feeding matches resolve */
  homeId: string | null;
  awayId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  /** penalty shootout, only for knockouts that end level */
  homePens: number | null;
  awayPens: number | null;
  status: MatchStatus;
  kickoff: string | null;
  venue: string;
  minute: number;
  goals: Goal[];
  cards: Card[];
  /** Match id of the home side's feeder (e.g. "r16-1"), for bracket wiring */
  homeFrom: string | null;
  awayFrom: string | null;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  surface: string;
}

export interface TournamentConfig {
  name: string;
  edition: string;
  organiser: string;
  kickoff: string;
  finalDate: string;
  prizePool: number;
  format: string;
}
