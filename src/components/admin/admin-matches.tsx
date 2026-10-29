"use client";

import * as React from "react";
import { AlertTriangle, Check, Plus, RotateCcw, Save, Trophy, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamCrest } from "@/components/team-crest";
import { FIXED_VENUE } from "@/lib/venues";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";
import { winnerOf } from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/lib/types";

const STATUSES: { value: Match["status"]; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "postponed", label: "Postponed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminMatches({
  matches: serverMatches,
  teams,
  onPublish,
  onResetBracket,
  onRefresh,
}: {
  matches: Match[];
  teams: Team[];
  onPublish: (matches: Match[]) => Promise<boolean>;
  onResetBracket: () => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const teamMap = React.useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team])), [teams]);
  const [matches, setMatches] = React.useState<Match[]>(serverMatches);
  const [dirty, setDirty] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const [lastServer, setLastServer] = React.useState<Match[]>(serverMatches);
  if (serverMatches !== lastServer) {
    setLastServer(serverMatches);
    if (!dirty) setMatches(serverMatches);
  }

  const [stage, setStage] = React.useState<Match["stage"] | "all">("r16");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const visible = React.useMemo(
    () =>
      [...matches]
        .filter((match) => stage === "all" || match.stage === stage)
        .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.slot - b.slot),
    [matches, stage],
  );

  const counts = React.useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    STAGE_ORDER.forEach((item) => {
      map[item] = { done: 0, total: 0 };
    });
    matches.forEach((match) => {
      map[match.stage].total += 1;
      if (match.status === "completed") map[match.stage].done += 1;
    });
    return map;
  }, [matches]);

  function edit(next: Match[]) {
    setMatches(next);
    setDirty(true);
  }

  async function publish() {
    if (publishing) return;
    setPublishing(true);
    const ok = await onPublish(matches);
    setPublishing(false);
    if (ok) setDirty(false);
    else await onRefresh();
  }

  function clearResult(matchId: string) {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    if (target.status === "completed") {
      toast.info("Clearing a confirmed result — downstream ties will be flagged for review.");
    }
    edit(
      matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              teamAScore: null,
              teamBScore: null,
              teamAPens: null,
              teamBPens: null,
              winnerId: null,
              status: "scheduled" as const,
              minute: 0,
              goals: [],
              cards: [],
              needsReview: false,
              reviewNote: null,
            }
          : match,
      ),
    );
  }

  const editing = editingId ? matches.find((match) => match.id === editingId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={stage === "all" ? "default" : "outline"} onClick={() => setStage("all")}>
          All rounds
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[0.6rem]">
            {matches.filter((match) => match.status === "completed").length}/{matches.length}
          </Badge>
        </Button>
        {STAGE_ORDER.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={stage === item ? "default" : "outline"}
            onClick={() => setStage(item)}
          >
            {STAGE_META[item].label}
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[0.6rem]">
              {counts[item]?.done ?? 0}/{counts[item]?.total ?? 0}
            </Badge>
          </Button>
        ))}

        <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus /> New match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <MatchForm
              key={editingId ?? "new"}
              match={editing}
              teams={teams}
              matches={matches}
              onSave={(saved) => {
                const exists = matches.some((item) => item.id === saved.id);
                edit(exists ? matches.map((item) => (item.id === saved.id ? saved : item)) : [...matches, saved]);
                setEditorOpen(false);
                setEditingId(null);
              }}
              onCancel={() => { setEditorOpen(false); setEditingId(null); }}
            />
          </DialogContent>
        </Dialog>

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
              <RotateCcw /> Reset all
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset every tie to “to be announced”?</AlertDialogTitle>
              <AlertDialogDescription>
                Clears all participants, scores and winners across the {matches.length} scheduled ties. Teams and
                players stay untouched. This cannot be undone.
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
            <Trophy className="size-4 text-primary" /> {stage === "all" ? "All rounds" : STAGE_META[stage].label}
            <span className="text-xs font-normal text-muted-foreground">
              {visible.length} ties · every team picks manually · venue fixed
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="bracket-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 pl-4">Tie</TableHead>
                  <TableHead className="min-w-[11rem]">Team A</TableHead>
                  <TableHead className="w-20 text-center">Score</TableHead>
                  <TableHead className="min-w-[11rem]">Team B</TableHead>
                  <TableHead className="w-24 text-center">Pens</TableHead>
                  <TableHead className="w-28">Winner</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-44">Kickoff</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((match) => {
                  const teamA = match.teamAId ? teamMap[match.teamAId] : null;
                  const teamB = match.teamBId ? teamMap[match.teamBId] : null;
                  const winner = winnerOf(match);
                  return (
                    <TableRow key={match.id} className={cn(match.needsReview && "bg-amber-500/5")}>
                      <TableCell className="pl-4 font-mono text-[0.65rem] text-muted-foreground">
                        <div className="font-semibold">{match.id.toUpperCase()}</div>
                        <div>{stage === "all" ? STAGE_META[match.stage].short : `M${match.slot}`}</div>
                      </TableCell>
                      <SideCell team={teamA} won={winner === teamA?.id} tba={match.teamAId === null} />
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <ScoreInput value={match.teamAScore} onChange={(value) => patchScore(match.id, "A", value)} label={`${teamA?.shortName ?? "Team A"} goals`} />
                          <span className="text-xs text-muted-foreground">–</span>
                          <ScoreInput value={match.teamBScore} onChange={(value) => patchScore(match.id, "B", value)} label={`${teamB?.shortName ?? "Team B"} goals`} />
                        </div>
                      </TableCell>
                      <SideCell team={teamB} won={winner === teamB?.id} tba={match.teamBId === null} />
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <ScoreInput value={match.teamAPens} small onChange={(value) => patchPens(match.id, "A", value)} label="Team A penalties" />
                          <span className="text-xs text-muted-foreground">–</span>
                          <ScoreInput value={match.teamBPens} small onChange={(value) => patchPens(match.id, "B", value)} label="Team B penalties" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <WinnerPicker match={match} onPick={(winnerId) => confirmWinner(match.id, winnerId)} />
                      </TableCell>
                      <TableCell>
                        <StatusPicker match={match} onPick={(status) => patchStatus(match.id, status)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="datetime-local"
                          value={toLocalInput(match.kickoff)}
                          onChange={(event) => edit(matches.map((item) => (item.id === match.id ? { ...item, kickoff: fromLocalInput(event.target.value) } : item)))}
                          className="h-7 w-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon-xs" variant="ghost" title="Open full editor" onClick={() => { setEditingId(match.id); setEditorOpen(true); }}>
                            <Trophy />
                          </Button>
                          <Button size="icon-xs" variant="ghost" title="Clear result" onClick={() => clearResult(match.id)}>
                            <Undo2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {matches.some((match) => match.needsReview) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
          <AlertTriangle className="size-3.5 text-amber-600" />
          <span>
            {matches.filter((match) => match.needsReview).length} tie(s) flagged:{" "}
            {matches.filter((match) => match.needsReview).map((match) => match.id.toUpperCase()).join(", ")} —{" "}
            {matches.find((match) => match.needsReview)?.reviewNote}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Check className="size-3 text-primary" /> Confirming a winner only marks eligibility — the next tie is
          never created automatically.
        </span>
        <span>
          Venue: <strong className="font-medium text-foreground">{FIXED_VENUE}</strong>
        </span>
      </div>
    </div>
  );

  function patchScore(matchId: string, side: "A" | "B", value: number | null) {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    const updated = normalisePens({ ...target, [side === "A" ? "teamAScore" : "teamBScore"]: value });
    edit(
      matches.map((match) =>
        match.id === matchId
          ? {
              ...updated,
              winnerId: null,
              status: updated.teamAScore !== null && updated.teamBScore !== null ? "completed" : target.status,
            }
          : match,
      ),
    );
  }

  function patchPens(matchId: string, side: "A" | "B", value: number | null) {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    edit(matches.map((match) => (match.id === matchId ? { ...match, winnerId: null, [side === "A" ? "teamAPens" : "teamBPens"]: value } : match)));
  }

  function patchStatus(matchId: string, status: Match["status"]) {
    edit(
      matches.map((match) => {
        if (match.id !== matchId) return match;
        if (status === "cancelled" || status === "postponed") {
          return { ...match, status, winnerId: null };
        }
        return { ...match, status };
      }),
    );
  }

  function confirmWinner(matchId: string, winnerId: string | null) {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    if (!winnerId) {
      edit(matches.map((match) => (match.id === matchId ? { ...match, winnerId: null, status: "scheduled" } : match)));
      return;
    }
    if (target.teamAScore === null || target.teamBScore === null) {
      toast.error("Enter both scores before confirming the winner.");
      return;
    }
    if (target.teamAScore === target.teamBScore && (target.teamAPens === null || target.teamBPens === null)) {
      toast.error("A level tie needs a shootout score before the winner can be confirmed.");
      return;
    }
    edit(
      matches.map((match) =>
        match.id === matchId ? { ...match, winnerId, status: "completed" as const, needsReview: false, reviewNote: null } : match,
      ),
    );
    toast.info("Winner staged — press “Save results” to publish.");
  }
}

/** A number box that keeps its own text while you type, so 0 → 19 never snaps back. */
function ScoreInput({
  value,
  onChange,
  label,
  small = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  small?: boolean;
}) {
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
      className={cn(
        "text-center font-mono tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        small ? "h-7 w-10 text-xs" : "h-7 w-12 text-sm",
      )}
    />
  );
}

function SideCell({ team, won, tba }: { team: Team | null; won: boolean; tba: boolean }) {
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        {team ? (
          <>
            <TeamCrest team={team} size="xs" />
            <span className={cn("truncate text-sm", won && "font-semibold text-primary")}>{team.name}</span>
          </>
        ) : (
          <span className={cn("text-xs italic", tba ? "text-amber-600" : "text-muted-foreground")}>
            {tba ? "To be announced" : "To be decided"}
          </span>
        )}
      </div>
    </TableCell>
  );
}

function WinnerPicker({ match, onPick }: { match: Match; onPick: (winnerId: string | null) => void }) {
  const options = [match.teamAId, match.teamBId].filter((id): id is string => Boolean(id));
  return (
    <Select value={match.winnerId ?? "none"} onValueChange={(value) => onPick(value === "none" ? null : value)}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Confirm" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No winner</SelectItem>
        {options.map((id) => (
          <SelectItem key={id} value={id}>
            {id.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusPicker({ match, onPick }: { match: Match; onPick: (status: Match["status"]) => void }) {
  return (
    <Select value={match.status} onValueChange={(value) => onPick(value as Match["status"])}>
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
  );
}

/** The full manual-scheduling form: round, both teams, kickoff, status, scores, pens, winner. */
function MatchForm({
  match,
  teams,
  matches,
  onSave,
  onCancel,
}: {
  match: Match | null;
  teams: Team[];
  matches: Match[];
  onSave: (match: Match) => void;
  onCancel: () => void;
}) {
  const isNew = !match;
  const [stage, setStage] = React.useState<Match["stage"]>(match?.stage ?? "r16");
  const [teamAId, setTeamAId] = React.useState<string>(match?.teamAId ?? "");
  const [teamBId, setTeamBId] = React.useState<string>(match?.teamBId ?? "");
  const [teamAScore, setTeamAScore] = React.useState<string>(match?.teamAScore === null || match?.teamAScore === undefined ? "" : String(match.teamAScore));
  const [teamBScore, setTeamBScore] = React.useState<string>(match?.teamBScore === null || match?.teamBScore === undefined ? "" : String(match.teamBScore));
  const [teamAPens, setTeamAPens] = React.useState<string>(match?.teamAPens === null || match?.teamAPens === undefined ? "" : String(match.teamAPens));
  const [teamBPens, setTeamBPens] = React.useState<string>(match?.teamBPens === null || match?.teamBPens === undefined ? "" : String(match.teamBPens));
  const [winnerId, setWinnerId] = React.useState<string>(match?.winnerId ?? "");
  const [status, setStatus] = React.useState<Match["status"]>(match?.status ?? "scheduled");
  const [kickoff, setKickoff] = React.useState<string>(match?.kickoff ? toLocalInput(match.kickoff) : "");
  const [error, setError] = React.useState<string | null>(null);

  const eligible = React.useMemo(() => {
    const eliminated = new Set<string>();
    matches.forEach((item) => {
      if (match && item.id === match.id) return;
      if (item.status !== "completed" || !item.winnerId || !item.teamAId || !item.teamBId) return;
      const loser = item.winnerId === item.teamAId ? item.teamBId : item.winnerId === item.teamBId ? item.teamAId : null;
      if (loser) eliminated.add(loser);
    });
    const previousWinners = new Set<string>();
    if (stage !== "r16") {
      const previous: Match["stage"] = stage === "qf" ? "r16" : stage === "sf" ? "qf" : "sf";
      matches.forEach((item) => {
        if (match && item.id === match.id) return;
        if (item.stage === previous && item.status === "completed" && item.winnerId) previousWinners.add(item.winnerId);
      });
    }
    return teams
      .filter((team) => !eliminated.has(team.id))
      .filter((team) => stage === "r16" || previousWinners.has(team.id));
  }, [matches, teams, stage, match]);

  const roundCounts = React.useMemo(() => {
    const map = new Map<Match["stage"], number>();
    matches.forEach((item) => {
      if (match && item.id === match.id) return;
      map.set(item.stage, (map.get(item.stage) ?? 0) + 1);
    });
    return map;
  }, [matches, match]);

  function handleSave() {
    const limit = stage === "r16" ? 8 : stage === "qf" ? 4 : stage === "sf" ? 2 : 1;
    if ((roundCounts.get(stage) ?? 0) >= limit && (!match || match.stage !== stage)) {
      setError(`This round already has ${limit} ties — pick a different round or edit an existing tie.`);
      return;
    }
    if (!teamAId || !teamBId) {
      setError("Select both teams. Unsure yet? Save the tie with no teams — it renders as “to be announced”.");
      return;
    }
    if (teamAId === teamBId) {
      setError("A team cannot play itself — pick two different teams.");
      return;
    }
    const aEligible = eligible.some((team) => team.id === teamAId);
    const bEligible = eligible.some((team) => team.id === teamBId);
    if (!aEligible || !bEligible) {
      setError("One of these teams is eliminated or has no confirmed win in the previous round.");
      return;
    }
    const parse = (raw: string) => (raw.trim() === "" ? null : Math.max(0, Math.trunc(Number(raw))));
    const a = parse(teamAScore);
    const b = parse(teamBScore);
    const ap = parse(teamAPens);
    const bp = parse(teamBPens);
    if ((a === null) !== (b === null)) {
      setError("Enter both scores, or leave both empty.");
      return;
    }
    if (winnerId) {
      if (a === null || b === null) {
        setError("Enter both scores before confirming the winner.");
        return;
      }
      if ((a > b && winnerId !== teamAId) || (b > a && winnerId !== teamBId)) {
        setError("The winner must match the scoreline.");
        return;
      }
      if (a === b) {
        if (ap === null || bp === null) {
          setError("A level tie needs a shootout score before the winner can be confirmed.");
          return;
        }
        if (ap === bp || (ap > bp && winnerId !== teamAId) || (bp > ap && winnerId !== teamBId)) {
          setError("The winner must match the shootout.");
          return;
        }
      }
    }
    const base: Match = match ?? {
      id: `${stage}-${Date.now().toString(36)}`,
      stage,
      slot: (roundCounts.get(stage) ?? 0) + 1,
      teamAId: null,
      teamBId: null,
      teamAScore: null,
      teamBScore: null,
      teamAPens: null,
      teamBPens: null,
      winnerId: null,
      status: "scheduled",
      kickoff: null,
      venue: FIXED_VENUE,
      minute: 0,
      goals: [],
      cards: [],
      needsReview: false,
      reviewNote: null,
    };
    onSave({
      ...base,
      stage,
      teamAId,
      teamBId,
      teamAScore: a,
      teamBScore: b,
      teamAPens: ap,
      teamBPens: bp,
      winnerId: winnerId || null,
      status: winnerId ? ("completed" as const) : status === "completed" && !winnerId ? ("scheduled" as const) : status,
      kickoff: kickoff ? fromLocalInput(kickoff) : null,
      venue: FIXED_VENUE,
      minute: winnerId ? 90 : base.minute,
    });
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isNew ? "Schedule a match manually" : `Edit ${match?.id.toUpperCase()}`}</DialogTitle>
        <DialogDescription>
          Nothing is automatic here — pick the round, both teams, kickoff, scores and the confirmed winner yourself.
          Venue is always {FIXED_VENUE}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1">
        <Label className="text-xs">Round</Label>
        <Select value={stage} onValueChange={(value) => setStage(value as Match["stage"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_ORDER.map((item) => (
              <SelectItem key={item} value={item}>
                {STAGE_META[item].label} ({roundCounts.get(item) ?? 0}/{STAGE_META[item].matches})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Team A</Label>
          <Select value={teamAId} onValueChange={(value) => setTeamAId(value === "tba" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="To be announced" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tba">To be announced</SelectItem>
              {teams.filter((team) => team.id !== teamBId).map((team) => (
                <SelectItem key={team.id} value={team.id} disabled={!eligible.some((item) => item.id === team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Team B</Label>
          <Select value={teamBId} onValueChange={(value) => setTeamBId(value === "tba" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="To be announced" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tba">To be announced</SelectItem>
              {teams.filter((team) => team.id !== teamAId).map((team) => (
                <SelectItem key={team.id} value={team.id} disabled={!eligible.some((item) => item.id === team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-[0.65rem] text-muted-foreground">
        {eligible.length} eligible {stage === "r16" ? "teams for this round" : "winners from the previous round"}.
        Eliminated teams never appear here.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Team A goals</Label>
          <Input type="number" min={0} value={teamAScore} onChange={(event) => setTeamAScore(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Team B goals</Label>
          <Input type="number" min={0} value={teamBScore} onChange={(event) => setTeamBScore(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Team A pens</Label>
          <Input type="number" min={0} value={teamAPens} onChange={(event) => setTeamAPens(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Team B pens</Label>
          <Input type="number" min={0} value={teamBPens} onChange={(event) => setTeamBPens(event.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Confirmed winner</Label>
          <Select value={winnerId || "none"} onValueChange={(value) => setWinnerId(value === "none" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="No winner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No winner</SelectItem>
              {[teamAId, teamBId].filter(Boolean).map((id) => (
                <SelectItem key={id} value={id}>
                  {teams.find((team) => team.id === id)?.name ?? id.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as Match["status"])}>
            <SelectTrigger>
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
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Date & kickoff</Label>
        <Input type="datetime-local" value={kickoff} onChange={(event) => setKickoff(event.target.value)} />
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save /> {isNew ? "Create match" : "Save match"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${date.getDate()}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Same rule the server applies: a knockout tie must be level to go to penalties. */
function normalisePens(match: Match): Match {
  const level = match.teamAScore !== null && match.teamAScore === match.teamBScore;
  return level ? match : { ...match, teamAPens: null, teamBPens: null };
}
