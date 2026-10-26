"use client";

import * as React from "react";
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";

/**
 * Read-only public state.
 * Every value here comes from the saved tournament file on the server; the public
 * site has no mutation path at all — all editing lives behind /admin.
 */
export interface TournamentState {
  matches: Match[];
  teams: Team[];
  venues: Venue[];
  config: TournamentConfig;
}

const TournamentContext = React.createContext<TournamentState | null>(null);

export function TournamentProvider({
  matches,
  teams,
  venues,
  config,
  children,
}: TournamentState & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ matches, teams, venues, config }),
    [matches, teams, venues, config],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament(): TournamentState {
  const context = React.useContext(TournamentContext);
  if (!context) throw new Error("useTournament must be used inside TournamentProvider");
  return context;
}
