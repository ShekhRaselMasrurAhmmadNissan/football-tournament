"use client";

import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META } from "@/lib/stages";
import { formatKickoff, scoreline, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/types";

/** Read-only match detail. Editing happens only in the /admin portal. */
export function MatchSheet({
  match,
  open,
  onOpenChange,
}: {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);

  if (!match) return null;

  const home = match.homeId ? teamMap[match.homeId] : null;
  const away = match.awayId ? teamMap[match.awayId] : null;
  const winner = winnerOf(match);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
              {STAGE_META[match.stage].short}
            </span>
            {STAGE_META[match.stage].label} · Match {match.slot}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {formatKickoff(match.kickoff)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {match.venue}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-border/70 bg-card/60 p-3">
            <TeamSide team={home} align="start" winner={winner === home?.id} />
            <div className="px-1 text-center">
              <p className="font-heading text-xl font-semibold tracking-tight tabular-nums">
                {scoreline(match)}
              </p>
              <p className="mt-0.5 text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                {match.status === "live" ? `${match.minute}'` : match.status}
              </p>
            </div>
            <TeamSide team={away} align="end" winner={winner === away?.id} />
          </div>

          {match.goals.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Goals
              </p>
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                {[...match.goals]
                  .sort((a, b) => a.minute - b.minute)
                  .map((goal) => (
                    <li key={goal.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                      <span className="font-medium">{goal.scorer}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{goal.minute}&apos;</span>
                        <span>{teamMap[goal.teamId]?.shortName ?? "—"}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {match.cards.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Cards
              </p>
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                {[...match.cards]
                  .sort((a, b) => a.minute - b.minute)
                  .map((card) => (
                    <li key={card.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2.5 rounded-[2px]",
                            card.type === "red" ? "bg-destructive" : "bg-amber-400",
                          )}
                        />
                        {card.player}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{card.minute}&apos;</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <SheetFooter className="text-[0.7rem] text-muted-foreground">
          Scores are published by the tournament organisers.
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function TeamSide({
  team,
  align,
  winner,
}: {
  team: Team | null;
  align: "start" | "end";
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5",
        align === "start" ? "items-start" : "items-end text-right",
      )}
    >
      {team ? (
        <>
          <TeamCrest team={team} size="md" glow={winner} />
          <span className={cn("truncate text-sm font-medium", winner && "text-primary")}>{team.name}</span>
        </>
      ) : (
        <>
          <span className="size-10 rounded-lg border border-dashed border-border" />
          <span className="text-sm text-muted-foreground">TBD</span>
        </>
      )}
    </div>
  );
}
