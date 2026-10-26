"use client";

import * as React from "react";
import { Trophy } from "lucide-react";
import { TeamCrest } from "@/components/team-crest";
import { MatchSheet } from "@/components/match-sheet";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META } from "@/lib/stages";
import { championOf, formatKickoff, scoreline, stageMatches, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Stage, Team } from "@/lib/types";

const COLUMNS: { stage: Stage; heightClass: string }[] = [
  { stage: "r16", heightClass: "gap-6" },
  { stage: "qf", heightClass: "gap-14" },
  { stage: "sf", heightClass: "gap-28" },
  { stage: "final", heightClass: "gap-0" },
];

export function BracketBoard() {
  const { matches, teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const [selected, setSelected] = React.useState<Match | null>(null);
  const [open, setOpen] = React.useState(false);

  const championId = championOf(matches);
  const champion = championId ? teamMap[championId] : null;

  function handleSelect(match: Match) {
    setSelected(match);
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Knockout Bracket</h1>
          <p className="text-sm text-muted-foreground">
            16 teams · 4 rounds · 15 matches. Click any tie to inspect or update the score.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
          {champion ? (
            <>
              <TeamCrest team={champion} size="sm" glow />
              <div className="leading-tight">
                <p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">Champion</p>
                <p className="text-sm font-semibold">{champion.name}</p>
              </div>
            </>
          ) : (
            <>
              <Trophy className="size-4 text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">Champion</p>
                <p className="text-sm font-medium text-muted-foreground">To be crowned</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bracket-scroll overflow-x-auto pb-3">
        <div className="flex min-w-[62rem] gap-4">
          {COLUMNS.map(({ stage, heightClass }) => {
            const list = stageMatches(matches, stage);
            return (
              <section key={stage} className="flex min-w-[13rem] flex-1 flex-col">
                <header className="mb-3 flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5">
                  <span className="font-heading text-xs font-semibold tracking-[0.14em] uppercase">
                    {STAGE_META[stage].label}
                  </span>
                  <span className="font-mono text-[0.65rem] text-muted-foreground">
                    {list.filter((match) => match.status === "finished").length}/{list.length}
                  </span>
                </header>
                <div className={cn("flex flex-1 flex-col justify-around", heightClass)}>
                  {list.map((match) => (
                    <BracketTie key={match.id} match={match} onSelect={handleSelect} />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="flex w-[13rem] flex-col">
            <header className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
              <span className="font-heading text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Champion
              </span>
              <Trophy className="size-3.5 text-primary" />
            </header>
            <div className="flex flex-1 items-center">
              <div className="w-full rounded-xl border border-primary/30 bg-gradient-to-b from-primary/15 to-transparent p-3 text-center">
                {champion ? (
                  <div className="flex flex-col items-center gap-2">
                    <TeamCrest team={champion} size="lg" glow />
                    <p className="font-heading text-sm font-semibold">{champion.name}</p>
                    <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                      {champion.city}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Awaiting the final whistle</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <MatchSheet match={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function BracketTie({ match, onSelect }: { match: Match; onSelect: (match: Match) => void }) {
  const { teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const home = match.homeId ? teamMap[match.homeId] : null;
  const away = match.awayId ? teamMap[match.awayId] : null;
  const winner = winnerOf(match);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onSelect(match)}
        className={cn(
          "w-full rounded-lg border border-border/70 bg-card/80 px-2 py-1.5 text-left transition-all hover:border-primary/50 hover:bg-card",
          match.status === "live" && "border-destructive/60",
        )}
      >
        <div className="mb-1 flex items-center justify-between text-[0.6rem] text-muted-foreground">
          <span className="font-mono">M{match.slot}</span>
          <span className="uppercase tracking-wider">
            {match.status === "finished" ? "FT" : match.status === "live" ? `${match.minute}'` : formatKickoff(match.kickoff)}
          </span>
        </div>
        <TieRow team={home} score={match.homeScore} pens={match.homePens} won={winner === home?.id} />
        <TieRow team={away} score={match.awayScore} pens={match.awayPens} won={winner === away?.id} />
      </button>
      <p className="mt-1 truncate text-[0.6rem] text-muted-foreground/70">
        {scoreline(match) === "vs" ? match.venue : `${scoreline(match)} · ${match.venue}`}
      </p>
    </div>
  );
}

function TieRow({
  team,
  score,
  pens,
  won,
}: {
  team: Team | null;
  score: number | null;
  pens: number | null;
  won: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {team ? <TeamCrest team={team} size="xs" /> : <span className="size-6 rounded border border-dashed border-border" />}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[0.8rem] font-medium",
          !team && "text-muted-foreground italic",
          won && "text-primary",
        )}
      >
        {team?.shortName ?? "TBD"}
      </span>
      {pens !== null && <span className="font-mono text-[0.6rem] text-muted-foreground">({pens})</span>}
      <span className={cn("w-4 text-right font-mono text-[0.8rem] font-semibold tabular-nums", won && "text-primary")}>
        {score ?? "–"}
      </span>
    </div>
  );
}
