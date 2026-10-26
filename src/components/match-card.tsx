"use client";

import * as React from "react";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";
import { formatKickoff, formatTime, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/types";

export function MatchCard({
  match,
  onSelect,
  compact = false,
}: {
  match: Match;
  onSelect?: (match: Match) => void;
  compact?: boolean;
}) {
  const { teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const home = match.homeId ? teamMap[match.homeId] : null;
  const away = match.awayId ? teamMap[match.awayId] : null;
  const winner = winnerOf(match);
  const finished = match.status === "finished";
  const live = match.status === "live";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className={cn(
        "group w-full rounded-xl border border-border/70 bg-card/70 p-3 text-left transition-all hover:border-primary/40 hover:bg-card",
        live && "border-destructive/50",
        compact && "p-2.5",
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span className="font-medium tracking-wider uppercase">{formatKickoff(match.kickoff)}</span>
        {live ? (
          <span className="inline-flex items-center gap-1 font-semibold text-destructive">
            <span className="size-1.5 rounded-full bg-destructive animate-pulse-ring" />
            LIVE {match.minute}&apos;
          </span>
        ) : (
          <span className={cn("font-medium tracking-wider uppercase", finished && "text-primary")}>
            {finished ? "FT" : "Upcoming"}
          </span>
        )}
      </div>

      <TeamRow team={home} score={match.homeScore} pens={match.homePens} winner={winner === home?.id} />
      <div className="my-1 h-px bg-border/60" />
      <TeamRow team={away} score={match.awayScore} pens={match.awayPens} winner={winner === away?.id} />
    </button>
  );
}

function TeamRow({
  team,
  score,
  pens,
  winner,
}: {
  team: Team | null;
  score: number | null;
  pens: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {team ? (
        <TeamCrest team={team} size="sm" />
      ) : (
        <span className="size-8 rounded-lg border border-dashed border-border" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          !team && "text-muted-foreground",
          winner && "text-primary",
        )}
      >
        {team?.name ?? "To be decided"}
      </span>
      <span className="flex items-baseline gap-1">
        {pens !== null && <span className="font-mono text-[0.65rem] text-muted-foreground">({pens})</span>}
        <span className={cn("w-5 text-right font-mono text-sm font-semibold tabular-nums", winner && "text-primary")}>
          {score ?? "–"}
        </span>
      </span>
    </div>
  );
}

export function MiniMatchRow({ match, onSelect }: { match: Match; onSelect?: (match: Match) => void }) {
  const { teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const home = match.homeId ? teamMap[match.homeId] : null;
  const away = match.awayId ? teamMap[match.awayId] : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
    >
      <span className="w-10 shrink-0 font-mono text-[0.7rem] text-muted-foreground">{formatTime(match.kickoff)}</span>
      <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-sm">
        <span className="truncate">{home?.shortName ?? "TBD"}</span>
        {home && <TeamCrest team={home} size="xs" />}
      </span>
      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
      </span>
      <span className="flex flex-1 items-center gap-1.5 truncate text-sm">
        {away && <TeamCrest team={away} size="xs" />}
        <span className="truncate">{away?.shortName ?? "TBD"}</span>
      </span>
    </button>
  );
}
