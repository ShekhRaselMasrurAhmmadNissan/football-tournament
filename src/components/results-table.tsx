"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MatchSheet } from "@/components/match-sheet";
import { TeamCrest } from "@/components/team-crest";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META } from "@/lib/stages";
import { formatKickoff, isDecided, winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

export function ResultsTable() {
  const { matches, teams } = useTournament();
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const [selected, setSelected] = React.useState<Match | null>(null);
  const [open, setOpen] = React.useState(false);

  const played = matches
    .filter(isDecided)
    .sort((a, b) => new Date(b.kickoff ?? 0).getTime() - new Date(a.kickoff ?? 0).getTime());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Results</h1>
        <p className="text-sm text-muted-foreground">
          {played.length} of {matches.length} ties completed. Click a row to edit the scoreline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed ties</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-4">Round</TableHead>
                <TableHead>Home</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
                <TableHead>Away</TableHead>
                <TableHead className="hidden w-40 md:table-cell">Kickoff</TableHead>
                <TableHead className="hidden w-40 lg:table-cell">Venue</TableHead>
                <TableHead className="w-24 pr-4 text-right">Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {played.map((match) => {
                const home = match.homeId ? teamMap[match.homeId] : null;
                const away = match.awayId ? teamMap[match.awayId] : null;
                const winner = winnerOf(match);
                return (
                  <TableRow
                    key={match.id}
                    onClick={() => {
                      setSelected(match);
                      setOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell className="pl-4">
                      <Badge variant="outline" className="font-mono text-[0.6rem] tracking-wider">
                        {STAGE_META[match.stage].short}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-2", winner === home?.id && "font-semibold")}>
                        {home && <TeamCrest team={home} size="xs" />}
                        <span className="truncate">{home?.name ?? "TBD"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold tabular-nums">
                      {match.homeScore} – {match.awayScore}
                      {match.homePens !== null && (
                        <span className="ml-1 text-[0.65rem] font-normal text-muted-foreground">
                          ({match.homePens}-{match.awayPens} p)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-2", winner === away?.id && "font-semibold")}>
                        {away && <TeamCrest team={away} size="xs" />}
                        <span className="truncate">{away?.name ?? "TBD"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatKickoff(match.kickoff)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{match.venue}</TableCell>
                    <TableCell className="pr-4 text-right text-xs font-medium text-primary">
                      {winner ? teamMap[winner].shortName : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {played.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No matches completed yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MatchSheet match={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
