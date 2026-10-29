"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";
import { teamRecords, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { PlayerPosition } from "@/lib/types";

const POSITION_ORDER: PlayerPosition[] = ["GK", "DF", "MF", "FW"];
const POSITION_LABEL: Record<PlayerPosition, string> = {
  GK: "Goalkeepers",
  DF: "Defenders",
  MF: "Midfielders",
  FW: "Forwards",
};

export function TeamsBoard() {
  const { matches, teams } = useTournament();
  const [query, setQuery] = React.useState("");
  const records = teamRecords(matches, teams);
  const recordMap = new Map(records.map((record) => [record.teamId, record]));

  const filtered = teams.filter((team) => {
    const haystack = `${team.name} ${team.city} ${team.manager} ${team.shortName}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} clubs · {teams.reduce((sum, team) => sum + team.squad.length, 0)} registered players
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search club, city or manager"
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => {
          const record = recordMap.get(team.id);
          const status = record?.eliminated ? "Eliminated" : record && record.won > 0 ? "Still alive" : "Yet to play";
          return (
            <Card key={team.id} className="overflow-hidden">
              <div
                className="h-1.5 w-full"
                style={{ backgroundImage: `linear-gradient(90deg, ${team.primary}, ${team.accent})` }}
              />
              <CardHeader className="flex-row items-center gap-3">
                <TeamCrest team={team} size="lg" />
                <div className="min-w-0">
                  <CardTitle className="truncate">{team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {team.city} · est. {team.founded}
                  </p>
                </div>
                <Badge
                  variant={record?.eliminated ? "destructive" : "secondary"}
                  className="ml-auto shrink-0 text-[0.6rem]"
                >
                  {status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <MiniStat label="P" value={record?.played ?? 0} />
                  <MiniStat label="W" value={record?.won ?? 0} />
                  <MiniStat label="L" value={record?.lost ?? 0} />
                  <MiniStat label="GD" value={record?.goalDiff ?? 0} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground">
                    <span>Goals for</span>
                    <span className="font-mono">{record?.goalsFor ?? 0}</span>
                  </div>
                  <Progress value={Math.min((record?.goalsFor ?? 0) * 20, 100)} className="mt-1 h-1" />
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3" /> Manager: {team.manager}
                </p>
                <details className="group">
                  <summary className="cursor-pointer list-none text-xs font-medium text-primary hover:underline">
                    Squad ({team.squad.length}) ▾
                  </summary>
                  <div className="mt-2 space-y-2">
                    {POSITION_ORDER.map((position) => {
                      const players = team.squad.filter((player) => player.position === position);
                      if (!players.length) return null;
                      return (
                        <div key={position}>
                          <p className="text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            {POSITION_LABEL[position]}
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {players.map((player) => (
                              <li key={player.id} className="flex items-center gap-2 text-xs">
                                <span className="w-5 text-right font-mono text-muted-foreground">{player.shirt}</span>
                                <span className="truncate">{player.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No club matches “{query}”.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Head-to-head snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {matches
            .filter((match) => match.status === "completed")
            .map((match) => {
              const winner = winnerOf(match);
              return (
                <div key={match.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-xs">
                  <span className="font-mono text-muted-foreground">
                    {match.teamAScore}-{match.teamBScore}
                  </span>
                  <span className={cn("truncate", winner === match.teamAId && "font-semibold text-primary")}>
                    {match.teamAId ? teams.find((team) => team.id === match.teamAId)?.shortName : "TBA"}
                  </span>
                  <span className="text-muted-foreground">v</span>
                  <span className={cn("truncate", winner === match.teamBId && "font-semibold text-primary")}>
                    {match.teamBId ? teams.find((team) => team.id === match.teamBId)?.shortName : "TBA"}
                  </span>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/60 px-1 py-1.5">
      <p className="text-[0.6rem] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
