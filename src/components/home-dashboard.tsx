"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, Goal, MapPin, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MatchCard, MiniMatchRow } from "@/components/match-card";
import { MatchSheet } from "@/components/match-sheet";
import { TeamCrest } from "@/components/team-crest";
import { BrandLogo } from "@/components/brand-logo";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META } from "@/lib/stages";
import {
  championOf,
  formatDay,
  formatKickoff,
  scoreline,
  sortedByKickoff,
  summarise,
  topScorers,
  teamRecords,
  winnerOf,
} from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

export function HomeDashboard() {
  const { matches, teams, venues, config } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const [selected, setSelected] = React.useState<Match | null>(null);
  const [open, setOpen] = React.useState(false);

  const summary = summarise(matches);
  const ordered = sortedByKickoff(matches);
  const upcoming = ordered.filter((match) => match.status === "scheduled" && match.homeId && match.awayId).slice(0, 3);
  const recent = ordered
    .filter((match) => match.status === "finished")
    .sort((a, b) => new Date(b.kickoff ?? 0).getTime() - new Date(a.kickoff ?? 0).getTime())
    .slice(0, 4);
  const scorers = topScorers(matches).slice(0, 5);
  const records = teamRecords(matches, teams).slice(0, 5);
  const champion = championOf(matches);
  const nextKickoff = upcoming[0] ?? ordered.find((match) => match.status === "scheduled") ?? null;

  function handleSelect(match: Match) {
    setSelected(match);
    setOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 px-5 py-10 sm:px-10 sm:py-14">
        <div className="stadium-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <BrandLogo size={56} withText={false} href={null} />
              <div className="leading-tight">
                <p className="font-heading text-sm font-semibold tracking-tight">{config.organiser}</p>
                <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">Est. 2006</p>
              </div>
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {config.format} · {config.edition}
            </div>
            <h1 className="text-balance-tight font-heading text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
              {config.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Sixteen clubs, fifteen matches, one trophy. Every tie is sudden death — one bad afternoon and
              the season is over. Follow the bracket, the goals and the drama in real time.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button asChild size="lg">
                <Link href="/bracket">
                  <Trophy /> Open bracket
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/fixtures">
                  <CalendarDays /> Full schedule <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> {teams.length} teams
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {venues.length} venues
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="size-3.5" /> ৳{config.prizePool.toLocaleString()} prize pool
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Tournament progress
              </p>
              <span className="font-mono text-xs text-primary">{summary.progress}%</span>
            </div>
            <Progress value={summary.progress} className="mt-2 h-1.5" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Matches played" value={`${summary.played}/${summary.totalMatches}`} />
              <Stat label="Goals scored" value={summary.goals} />
              <Stat label="Goals / match" value={summary.avgGoals} />
              <Stat label="Shootouts" value={summary.shootouts} />
            </div>
            {nextKickoff && (
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-2.5">
                <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Next kickoff
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {nextKickoff.homeId ? teamMap[nextKickoff.homeId].shortName : "TBD"} vs{" "}
                  {nextKickoff.awayId ? teamMap[nextKickoff.awayId].shortName : "TBD"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatKickoff(nextKickoff.kickoff)} · {nextKickoff.venue}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stage strip */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["r16", "qf", "sf", "final"] as const).map((stage) => {
          const list = matches.filter((match) => match.stage === stage);
          const done = list.filter((match) => match.status === "finished").length;
          return (
            <Link
              key={stage}
              href="/bracket"
              className="group rounded-xl border border-border/70 bg-card/60 p-3 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {STAGE_META[stage].label}
              </p>
              <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
                {done}
                <span className="text-sm text-muted-foreground">/{list.length}</span>
              </p>
              <p className="text-[0.7rem] text-muted-foreground">ties decided</p>
            </Link>
          );
        })}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Match centre */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="size-4 text-destructive" /> Match centre
                </CardTitle>
                <CardDescription>Latest results and the next ties up</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href="/results">
                  All results <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {recent.map((match) => (
                <MatchCard key={match.id} match={match} onSelect={handleSelect} />
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground">No matches played yet — the draw is still warm.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-4" /> Coming up
                </CardTitle>
                <CardDescription>Next fixtures on the calendar</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href="/fixtures">
                  Schedule <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((match) => (
                <MatchCard key={match.id} match={match} onSelect={handleSelect} />
              ))}
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">Every remaining tie is waiting on a result.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side rail */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="size-4" /> Golden boot race
              </CardTitle>
              <CardDescription>Top scorers so far</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {scorers.map((row, index) => {
                const team = teamMap[row.teamId];
                return (
                  <div key={`${row.teamId}-${row.player}`} className="flex items-center gap-2.5">
                    <span className="w-4 font-mono text-xs text-muted-foreground">{index + 1}</span>
                    {team && <TeamCrest team={team} size="xs" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.player}</p>
                      <p className="truncate text-[0.7rem] text-muted-foreground">{team?.name}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary tabular-nums">{row.goals}</span>
                  </div>
                );
              })}
              {scorers.length === 0 && <p className="text-sm text-muted-foreground">No goals recorded yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Power ranking</CardTitle>
              <CardDescription>Points earned across all rounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {records.map((record, index) => {
                const team = teamMap[record.teamId];
                return (
                  <div key={record.teamId} className="flex items-center gap-2.5">
                    <span className="w-4 font-mono text-xs text-muted-foreground">{index + 1}</span>
                    {team && <TeamCrest team={team} size="xs" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{team?.name}</p>
                    <span className="font-mono text-xs text-muted-foreground">
                      {record.won}-{record.lost}
                    </span>
                    <span className="w-6 text-right font-mono text-sm font-semibold tabular-nums">
                      {record.points}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card
            className={cn(
              "border-primary/30 bg-gradient-to-b from-primary/10 to-transparent",
              champion && "border-primary/50",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4 text-primary" /> The trophy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {champion ? (
                <div className="flex items-center gap-3">
                  <TeamCrest team={teamMap[champion]} size="lg" glow />
                  <div>
                    <p className="font-heading text-sm font-semibold">{teamMap[champion].name}</p>
                    <p className="text-xs text-muted-foreground">Champions of {config.edition}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fifteen matches. One survivor. The final is set for {formatDay(config.finalDate)}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent list */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Latest scorelines</CardTitle>
          <CardDescription>Newest first — click a row for details</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-0">
          {recent.map((match) => (
            <MiniMatchRow key={match.id} match={match} onSelect={handleSelect} />
          ))}
          {recent.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nothing to show yet.</p>}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[0.7rem] text-muted-foreground">
        Biggest win so far:{" "}
        {summary.biggestWin
          ? `${teamMap[winnerOf(summary.biggestWin) ?? summary.biggestWin.homeId ?? "t1"]?.name ?? "TBD"} — ${scoreline(summary.biggestWin)}`
          : "none yet"}
      </p>

      <MatchSheet match={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-2">
      <p className="text-[0.6rem] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
