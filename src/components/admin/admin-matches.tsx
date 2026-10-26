"use client";

import * as React from "react";
import { Check, RotateCcw, Save, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TeamCrest } from "@/components/team-crest";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";
import { winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Team, Venue } from "@/lib/types";

const STATUSES: { value: Match["status"]; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function AdminMatches({
  matches: serverMatches,
  teams,
  venues,
  onPublish,
  onResetBracket,
}: {
  matches: Match[];
  teams: Team[];
  venues: Venue[];
  onChange?: (matches: Match[]) => void;
  onPublish: (matches: Match[]) => Promise<boolean>;
  onResetBracket: () => Promise<void>;
}) {
  /**
   * The table edits its own draft copy. Nothing above this component can remount
   * it or reset the boxes while you are typing — the draft only changes when you
   * press Publish and the server confirms what it stored.
   */
  const [matches, setMatches] = React.useState<Match[]>(serverMatches);
  const [dirty, setDirty] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  // Adopt the server copy only while the draft is clean (React's own pattern for
  // "state derived from props": compare the previous prop during render).
  const [lastServer, setLastServer] = React.useState<Match[]>(serverMatches);
  if (serverMatches !== lastServer) {
    setLastServer(serverMatches);
    if (!dirty) setMatches(serverMatches);
  }

  function onChange(next: Match[]) {
    setMatches(next);
    setDirty(true);
  }

  async function publish() {
    if (publishing) return;
    setPublishing(true);
    const ok = await onPublish(matches);
    setPublishing(false);
    if (ok) setDirty(false);
  }

  const [stage, setStage] = React.useState<Match["stage"]>("r16");
  const [showAll, setShowAll] = React.useState(false);
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const visible = React.useMemo(
    () =>
      [...matches]
        .filter((match) => showAll || match.stage === stage)
        .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.slot - b.slot),
    [matches, showAll, stage],
  );

  /** Only regenerate *other* rows: editing one tie must never wipe the rest. */
  const counts = React.useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    STAGE_ORDER.forEach((item) => {
      map[item] = { done: 0, total: 0 };
    });
    matches.forEach((match) => {
      map[match.stage].total += 1;
      if (match.status === "finished") map[match.stage].done += 1;
    });
    return map;
  }, [matches]);

  function patch(matchId: string, changes: Partial<Match>) {
    const next = matches.map((match) => (match.id === matchId ? { ...match, ...changes } : match));
    onChange(next);
  }

  /** Same rule the server applies: a knockout tie must be level to go to penalties. */
  function normalisePens(match: Match): Match {
    const level =
      match.stage !== "r16" &&
      match.homeScore !== null &&
      match.awayScore !== null &&
      match.homeScore === match.awayScore;
    return level ? match : { ...match, homePens: null, awayPens: null };
  }

  function patchScore(matchId: string, side: "home" | "away", value: number | null) {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    const updated = normalisePens({ ...target, [side === "home" ? "homeScore" : "awayScore"]: value });
    patch(matchId, {
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
      homePens: updated.homePens,
      awayPens: updated.awayPens,
      status: updated.homeScore !== null && updated.awayScore !== null ? "finished" : target.status,
    });
  }

  function patchPens(matchId: string, side: "home" | "away", raw: string) {
    const trimmed = raw.trim();
    const value = trimmed === "" ? null : Math.max(0, Math.trunc(Number(trimmed)));
    if (value !== null && Number.isNaN(value)) return;
    patch(matchId, side === "home" ? { homePens: value } : { awayPens: value });
  }

  function clearResult(matchId: string) {
    toast.info("Result cleared — press Publish to save");
    patch(matchId, {
      homeScore: null,
      awayScore: null,
      homePens: null,
      awayPens: null,
      status: "scheduled",
      minute: 0,
      goals: [],
      cards: [],
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={showAll ? "default" : "outline"}
          onClick={() => setShowAll(true)}
        >
          All rounds
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[0.6rem]">
            {matches.filter((match) => match.status === "finished").length}/{matches.length}
          </Badge>
        </Button>
        {STAGE_ORDER.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={!showAll && stage === item ? "default" : "outline"}
            onClick={() => {
              setStage(item);
              setShowAll(false);
            }}
          >
            {STAGE_META[item].label}
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[0.6rem]">
              {counts[item]?.done ?? 0}/{counts[item]?.total ?? 0}
            </Badge>
          </Button>
        ))}

        <Button
          size="sm"
          variant={dirty ? "default" : "secondary"}
          className="ml-auto"
          disabled={publishing}
          onClick={() => void publish()}
        >
          {publishing ? <RotateCcw className="animate-spin" /> : <Save />}
          {publishing ? "Saving…" : dirty ? "Save results" : "Saved"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <RotateCcw /> Reset bracket
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Wipe every result?</AlertDialogTitle>
              <AlertDialogDescription>
                This rebuilds the 15-match bracket from the current team list and deletes all scores, goals and
                shootouts. It cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep results</AlertDialogCancel>
              <AlertDialogAction onClick={() => void onResetBracket()}>Reset everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-primary" /> {showAll ? "All rounds" : STAGE_META[stage].label}
            <span className="text-xs font-normal text-muted-foreground">
              {visible.length} ties · edit scores, status, kickoff and venue
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bracket-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead className="min-w-[15rem]">Home</TableHead>
                  <TableHead className="min-w-[15rem]">Away</TableHead>
                  <TableHead className="w-16 text-center">Score</TableHead>
                  <TableHead className="w-16 text-center">Pens</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-44">Kickoff</TableHead>
                  <TableHead className="w-40">Venue</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((match) => {
                  const home = match.homeId ? teamMap[match.homeId] : null;
                  const away = match.awayId ? teamMap[match.awayId] : null;
                  const level =
                    match.homeScore !== null && match.homeScore === match.awayScore && match.stage !== "r16";
                  const winner = winnerOf(match);

                  return (
                    <TableRow key={match.id}>
                      <TableCell className="pl-4 font-mono text-[0.65rem] text-muted-foreground">
                        {showAll ? `${STAGE_META[match.stage].short}·M${match.slot}` : `M${match.slot}`}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {home ? <TeamCrest team={home} size="xs" /> : null}
                          <span className={cn("truncate text-sm", winner === home?.id && "font-semibold text-primary")}>
                            {home?.name ?? "To be decided"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {away ? <TeamCrest team={away} size="xs" /> : null}
                          <span className={cn("truncate text-sm", winner === away?.id && "font-semibold text-primary")}>
                            {away?.name ?? "To be decided"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <ScoreInput
                            value={match.homeScore}
                            onChange={(value) => patchScore(match.id, "home", value)}
                            label={`${home?.shortName ?? "Home"} goals`}
                          />
                          <span className="text-xs text-muted-foreground">-</span>
                          <ScoreInput
                            value={match.awayScore}
                            onChange={(value) => patchScore(match.id, "away", value)}
                            label={`${away?.shortName ?? "Away"} goals`}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={match.homePens ?? ""}
                            onChange={(event) => patchPens(match.id, "home", event.target.value)}
                            className={cn(
                              "h-7 w-10 text-center font-mono text-xs tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                              !level && "opacity-50",
                            )}
                          />
                          <span className="text-xs text-muted-foreground">-</span>
                          <Input
                            type="number"
                            min={0}
                            value={match.awayPens ?? ""}
                            onChange={(event) => patchPens(match.id, "away", event.target.value)}
                            className={cn(
                              "h-7 w-10 text-center font-mono text-xs tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                              !level && "opacity-50",
                            )}
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={match.status}
                          onValueChange={(value) =>
                            patch(match.id, {
                              status: value as Match["status"],
                              minute: value === "finished" ? 90 : match.minute,
                            })
                          }
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Input
                          type="datetime-local"
                          value={toLocalInput(match.kickoff)}
                          onChange={(event) => patch(match.id, { kickoff: fromLocalInput(event.target.value) })}
                          className="h-7 w-full text-xs"
                        />
                      </TableCell>

                      <TableCell>
                        <Select
                          value={match.venue}
                          onValueChange={(value) => patch(match.id, { venue: value })}
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.name}>
                                {venue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="pr-4 text-right">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          title="Clear result"
                          onClick={() => clearResult(match.id)}
                        >
                          <RotateCcw />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Check className="size-3 text-primary" /> Winners flow forward automatically when you save.
        </span>
        <span>
          <Label className="text-[0.7rem] text-muted-foreground">Penalties</Label> unlock only when a knockout tie is
          level after 90.
        </span>
      </div>
    </div>
  );
}

/** A number box that keeps its own text while you type, so 0 → 19 never snaps back. */
function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
}) {
  // Uncontrolled while typing: the browser owns the text, the parent owns the number.
  const [text, setText] = React.useState(value === null ? "" : String(value));

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={label}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const trimmed = raw.trim();
        if (trimmed === "") {
          onChange(null);
          return;
        }
        const parsed = Math.trunc(Number(trimmed));
        if (!Number.isNaN(parsed)) onChange(Math.max(0, parsed));
      }}
      className="h-7 w-12 text-center font-mono tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}
