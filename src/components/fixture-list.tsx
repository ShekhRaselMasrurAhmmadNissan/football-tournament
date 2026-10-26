"use client";

import * as React from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/match-card";
import { MatchSheet } from "@/components/match-sheet";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";
import { formatDay, sortedByKickoff } from "@/lib/tournament-engine";
import type { Match, Stage } from "@/lib/types";

type Filter = "all" | Stage;

export function FixtureList() {
  const { matches } = useTournament();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [selected, setSelected] = React.useState<Match | null>(null);
  const [open, setOpen] = React.useState(false);

  const ordered = sortedByKickoff(matches).filter((match) => filter === "all" || match.stage === filter);
  const byDay = ordered.reduce<Record<string, Match[]>>((acc, match) => {
    const day = formatDay(match.kickoff);
    acc[day] = acc[day] ? [...acc[day], match] : [match];
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Fixtures</h1>
          <p className="text-sm text-muted-foreground">
            Every tie, in kickoff order. Times shown in Bangladesh Standard Time (GMT+6).
          </p>
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {STAGE_ORDER.map((stage) => (
              <TabsTrigger key={stage} value={stage}>
                {STAGE_META[stage].short}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6">
        {Object.entries(byDay).map(([day, list]) => (
          <section key={day}>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="size-3.5 text-primary" />
              <h2 className="font-heading text-xs font-semibold tracking-[0.16em] uppercase">{day}</h2>
              <span className="font-mono text-[0.65rem] text-muted-foreground">{list.length} matches</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSelect={(value) => {
                    setSelected(value);
                    setOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
        <MapPin className="size-3" /> Venues are provisional until the organising committee confirms the ground
        allocations.
      </p>

      <MatchSheet match={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
