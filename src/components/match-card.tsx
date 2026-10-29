"use client";

import * as React from "react";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";
import { formatKickoff, formatTime, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/types";

const STATUS_LABEL: Record<Match["status"], string> = {
  scheduled: "Upcoming",
  postponed: "Postponed",
  completed: "FT",
  cancelled: "Cancelled",
};

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
  const teamA = match.teamAId ? teamMap[match.teamAId] : null;
  const teamB = match.teamBId ? teamMap[match.teamBId] : null;
  const winner = winnerOf(match);
  const completed = match.status === "completed";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className={cn(
        "group w-full rounded-xl border border-border/70 bg-card/70 p-3 text-left transition-all hover:border-primary/40 hover:bg-card",
        match.status === "postponed" && "border-amber-500/50",
        match.status === "cancelled" && "opacity-70",
        compact && "p-2.5",
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span className="font-medium tracking-wider uppercase">{formatKickoff(match.kickoff)}</span>
        <span className={cn("font-medium tracking-wider uppercase", completed && "text-primary")}>
          {STATUS_LABEL[match.status]}
        </span>
      </div>

      <TeamRow team={teamA} score={match.teamAScore} pens={match.teamAPens} winner={winner === teamA?.id} tba={match.teamAId === null} />
      <div className="my-1 h-px bg-border/60" />
      <TeamRow team={teamB} score={match.teamBScore} pens={match.teamBPens} winner={winner === teamB?.id} tba={match.teamBId === null} />
    </button>
  );
}

function TeamRow({
  team,
  score,
  pens,
  winner,
  tba,
}: {
  team: Team | null;
  score: number | null;
  pens: number | null;
  winner: boolean;
  tba: boolean;
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
          tba ? "italic text-amber-600" : !team && "text-muted-foreground",
          winner && "text-primary",
        )}
      >
        {team?.name ?? (tba ? "To be announced" : "To be decided")}
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
  const teamA = match.teamAId ? teamMap[match.teamAId] : null;
  const teamB = match.teamBId ? teamMap[match.teamBId] : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
      aria-label={`${teamA?.name ?? "To be announced"} versus ${teamB?.name ?? "to be announced"}`}
    >
      <span className="w-10 shrink-0 font-mono text-[0.7rem] text-muted-foreground">{formatTime(match.kickoff)}</span>
      <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-sm">
        <span className="truncate">{teamA?.shortName ?? "TBA"}</span>
        {teamA && <TeamCrest team={teamA} size="xs" />}
      </span>
      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {match.teamAScore ?? "-"}:{match.teamBScore ?? "-"}
      </span>
      <span className="flex flex-1 items-center gap-1.5 truncate text-sm">
        {teamB && <TeamCrest team={teamB} size="xs" />}
        <span className="truncate">{teamB?.shortName ?? "TBA"}</span>
      </span>
    </button>
  );
}
