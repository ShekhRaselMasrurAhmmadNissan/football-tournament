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

const STATUS_LABEL: Record<Match["status"], string> = {
  scheduled: "Scheduled",
  postponed: "Postponed",
  completed: "Completed",
  cancelled: "Cancelled",
};

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
          {played.length} of {matches.length} ties completed. Click a row for details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed ties</CardTitle>
          <CardDescription>Confirmed winners only — newest first</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-4">Round</TableHead>
                <TableHead>Team A</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
                <TableHead>Team B</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="hidden w-40 md:table-cell">Kickoff</TableHead>
                <TableHead className="hidden w-40 lg:table-cell">Venue</TableHead>
                <TableHead className="w-24 pr-4 text-right">Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {played.map((match) => {
                const teamA = match.teamAId ? teamMap[match.teamAId] : null;
                const teamB = match.teamBId ? teamMap[match.teamBId] : null;
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
                      <div className={cn("flex items-center gap-2", winner === teamA?.id && "font-semibold")}>
                        {teamA && <TeamCrest team={teamA} size="xs" />}
                        <span className="truncate">{teamA?.name ?? "TBA"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold tabular-nums">
                      {match.teamAScore} – {match.teamBScore}
                      {match.teamAPens !== null && (
                        <span className="ml-1 text-[0.65rem] font-normal text-muted-foreground">
                          ({match.teamAPens}-{match.teamBPens} p)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-2", winner === teamB?.id && "font-semibold")}>
                        {teamB && <TeamCrest team={teamB} size="xs" />}
                        <span className="truncate">{teamB?.name ?? "TBA"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {STATUS_LABEL[match.status]}
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
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No ties completed yet — results appear here once the admin confirms a winner.
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
