export type Stage = "r16" | "qf" | "sf" | "final";

export type MatchStatus = "scheduled" | "postponed" | "completed" | "cancelled";

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

/**
 * A knockout tie. There is NO home/away system — teamA/teamB are neutral
 * labels for the two participants only. Every tie is created manually by
 * the admin; nothing here is ever generated automatically.
 */
export interface Match {
  id: string;
  stage: Stage;
  slot: number;
  /** null until the admin manually assigns a team */
  teamAId: string | null;
  teamBId: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
  /** penalty shootout, only for ties level after normal time */
  teamAPens: number | null;
  teamBPens: number | null;
  /** admin-confirmed winner. A team only progresses via this field. */
  winnerId: string | null;
  status: MatchStatus;
  kickoff: string | null;
  /** always the fixed tournament venue */
  venue: string;
  minute: number;
  goals: Goal[];
  cards: Card[];
  /** set when a correction upstream may have invalidated this tie */
  needsReview: boolean;
  reviewNote: string | null;
  /** @deprecated — kept only so old documents can be migrated on read */
  homeFrom?: string | null;
  /** @deprecated — kept only so old documents can be migrated on read */
  awayFrom?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  surface: string;
}

export interface Award {
  id: string;
  title: string;
  /** confirmed recipient — null means not yet awarded */
  recipient: string | null;
  note: string;
}

export interface TournamentConfig {
  name: string;
  edition: string;
  organiser: string;
  kickoff: string;
  finalDate: string;
  prizePool: number;
  format: string;
  /** fixed venue for the whole tournament */
  venue: string;
  championPrize: number;
  runnerUpPrize: number;
  awards: Award[];
}
