"use client";

import * as React from "react";
import { Goal, Shield, Timer, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";

import { summarise, teamRecords, topScorers } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";

export function StatsBoard() {
  const { matches, teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const summary = summarise(matches);
  const scorers = topScorers(matches);
  const records = teamRecords(matches, teams);
  const maxGoals = scorers[0]?.goals ?? 1;

  const defence = [...records]
    .filter((record) => record.played > 0)
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.cleanSheets - a.cleanSheets)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tournament statistics</h1>
        <p className="text-sm text-muted-foreground">Live numbers across all completed knockout ties.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Goal} label="Total goals" value={summary.goals} hint={`${summary.avgGoals} per match`} />
        <KpiCard icon={Shield} label="Clean sheets" value={summary.cleanSheets} hint="shutouts recorded" />
        <KpiCard icon={Timer} label="Shootouts" value={summary.shootouts} hint="ties settled from 12 yards" />
        <KpiCard
          icon={Trophy}
          label="Progress"
          value={`${summary.progress}%`}
          hint={`${summary.played} of ${summary.totalMatches} matches`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Golden boot</CardTitle>
            <CardDescription>Goals scored in the knockout rounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {scorers.slice(0, 8).map((row, index) => {
              const team = teamMap[row.teamId];
              return (
                <div key={`${row.teamId}-${row.player}`} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 font-mono text-xs text-muted-foreground">{index + 1}</span>
                    {team && <TeamCrest team={team} size="xs" />}
                    <span className="min-w-0 flex-1 truncate font-medium">{row.player}</span>
                    <span className="truncate text-[0.7rem] text-muted-foreground">{team?.shortName}</span>
                    <span className="font-mono text-sm font-semibold text-primary tabular-nums">{row.goals}</span>
                  </div>
                  <Progress value={(row.goals / maxGoals) * 100} className="h-1" />
                </div>
              );
            })}
            {scorers.length === 0 && <p className="text-sm text-muted-foreground">No goals logged yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best defence</CardTitle>
            <CardDescription>Fewest goals conceded per club</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Club</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">GA</TableHead>
                  <TableHead className="pr-4 text-center">CS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defence.map((record) => {
                  const team = teamMap[record.teamId];
                  return (
                    <TableRow key={record.teamId}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <TeamCrest team={team} size="xs" />
                          <span className="truncate text-sm">{team?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.played}</TableCell>
                      <TableCell className="text-center font-mono text-xs font-semibold">{record.goalsAgainst}</TableCell>
                      <TableCell className="pr-4 text-center font-mono text-xs">{record.cleanSheets}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full club table</CardTitle>
          <CardDescription>Ranked by points, then goal difference</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bracket-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 pl-4">#</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GA</TableHead>
                  <TableHead className="text-center">GD</TableHead>
                  <TableHead className="text-center">Pts</TableHead>
                  <TableHead className="pr-4 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => {
                  const team = teamMap[record.teamId];
                  return (
                    <TableRow key={record.teamId} className={cn(record.eliminated && "opacity-60")}>
                      <TableCell className="pl-4 font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TeamCrest team={team} size="xs" />
                          <span className="truncate text-sm font-medium">{team?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.played}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.won}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.drawn}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.lost}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.goalsFor}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{record.goalsAgainst}</TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {record.goalDiff > 0 ? `+${record.goalDiff}` : record.goalDiff}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-semibold">{record.points}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Badge
                          variant={record.eliminated ? "destructive" : "secondary"}
                          className="text-[0.6rem]"
                        >
                          {record.eliminated ? "Out" : record.played ? "Alive" : "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Goal;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
          <Icon className="size-3.5 text-primary" /> {label}
        </div>
        <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-[0.7rem] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
