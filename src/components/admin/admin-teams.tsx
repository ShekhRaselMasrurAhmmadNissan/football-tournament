"use client";

import * as React from "react";
import { Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamCrest } from "@/components/team-crest";
import type { Player, PlayerPosition, Team } from "@/lib/types";

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

export function AdminTeams({
  teams,
  onChange,
  onAddTeam,
  onRemoveTeam,
  usedTeamIds,
}: {
  teams: Team[];
  onChange: (teams: Team[]) => void;
  onAddTeam: () => Promise<void>;
  onRemoveTeam: (teamId: string) => Promise<void>;
  usedTeamIds: Set<string>;
}) {
  const [openTeam, setOpenTeam] = React.useState<string | null>(null);

  function patchTeam(teamId: string, changes: Partial<Team>) {
    onChange(teams.map((team) => (team.id === teamId ? { ...team, ...changes } : team)));
  }

  function patchSquad(teamId: string, squad: Player[]) {
    patchTeam(teamId, { squad });
  }

  function addPlayer(team: Team) {
    const nextIndex = team.squad.length + 1;
    patchSquad(team.id, [
      ...team.squad,
      { id: `${team.id}-p${nextIndex}-${Date.now()}`, name: "New player", position: "MF", shirt: nextIndex },
    ]);
  }

  return (
    <div className="space-y-4">
      <SlotsBar count={teams.length} />
      <p className="text-xs text-muted-foreground">
        Editing a team or its players never touches results or progression. Removing a team with confirmed
        results is blocked — correct those results first.
      </p>
      <div>
        <button
          type="button"
          onClick={() => void onAddTeam()}
          disabled={teams.length >= 16}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3.5" /> Add team ({teams.length}/16)
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {teams.map((team, index) => (
          <Card key={team.id} size="sm">
            <CardHeader className="flex-row items-center gap-2">
              <span className="w-5 font-mono text-xs text-muted-foreground">{index + 1}</span>
              <TeamCrest team={team} size="sm" />
              <Input
                value={team.name}
                onChange={(event) => patchTeam(team.id, { name: event.target.value })}
                className="h-7 flex-1 text-sm font-medium"
              />
              <Input
                value={team.shortName}
                onChange={(event) => patchTeam(team.id, { shortName: event.target.value.toUpperCase().slice(0, 4) })}
                className="h-7 w-14 text-center font-mono text-xs"
                title="Short name"
              />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="City">
                  <Input
                    value={team.city}
                    onChange={(event) => patchTeam(team.id, { city: event.target.value })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="Manager">
                  <Input
                    value={team.manager}
                    onChange={(event) => patchTeam(team.id, { manager: event.target.value })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="Founded">
                  <Input
                    type="number"
                    value={team.founded}
                    onChange={(event) => patchTeam(team.id, { founded: Number(event.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="Crest initials">
                  <Input
                    value={team.crest}
                    onChange={(event) => patchTeam(team.id, { crest: event.target.value.toUpperCase().slice(0, 3) })}
                    className="h-7 text-center font-mono text-xs"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Primary colour">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={team.primary}
                      onChange={(event) => patchTeam(team.id, { primary: event.target.value })}
                      className="h-7 w-9 cursor-pointer rounded border border-input bg-transparent"
                      aria-label="Primary colour"
                    />
                    <Input
                      value={team.primary}
                      onChange={(event) => patchTeam(team.id, { primary: event.target.value })}
                      className="h-7 font-mono text-[0.7rem]"
                    />
                  </div>
                </Field>
                <Field label="Accent colour">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={team.accent}
                      onChange={(event) => patchTeam(team.id, { accent: event.target.value })}
                      className="h-7 w-9 cursor-pointer rounded border border-input bg-transparent"
                      aria-label="Accent colour"
                    />
                    <Input
                      value={team.accent}
                      onChange={(event) => patchTeam(team.id, { accent: event.target.value })}
                      className="h-7 font-mono text-[0.7rem]"
                    />
                  </div>
                </Field>
              </div>

              <RemoveTeamButton
                teamName={team.name}
                inUse={usedTeamIds.has(team.id)}
                onRemove={() => void onRemoveTeam(team.id)}
              />
              <details
                className="group rounded-md border border-border/60"
                open={openTeam === team.id}
                onToggle={(event) => setOpenTeam((event.currentTarget as HTMLDetailsElement).open ? team.id : null)}
              >
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary">
                  <Users className="size-3" /> Squad ({team.squad.length})
                </summary>
                <div className="space-y-1.5 border-t border-border/60 p-2">
                  {team.squad.map((player, playerIndex) => (
                    <div key={player.id} className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={player.shirt}
                        onChange={(event) => {
                          const squad = [...team.squad];
                          squad[playerIndex] = { ...player, shirt: Number(event.target.value) || 0 };
                          patchSquad(team.id, squad);
                        }}
                        className="h-6 w-11 text-center font-mono text-[0.7rem]"
                        aria-label="Shirt number"
                      />
                      <Input
                        value={player.name}
                        onChange={(event) => {
                          const squad = [...team.squad];
                          squad[playerIndex] = { ...player, name: event.target.value };
                          patchSquad(team.id, squad);
                        }}
                        className="h-6 flex-1 text-xs"
                      />
                      <Select
                        value={player.position}
                        onValueChange={(value) => {
                          const squad = [...team.squad];
                          squad[playerIndex] = { ...player, position: value as PlayerPosition };
                          patchSquad(team.id, squad);
                        }}
                      >
                        <SelectTrigger size="sm" className="h-6 w-16 text-[0.7rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => patchSquad(team.id, team.squad.filter((item) => item.id !== player.id))}
                        aria-label="Remove player"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button size="xs" variant="outline" onClick={() => addPlayer(team)}>
                    <Plus /> Add player
                  </Button>
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[0.65rem] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SlotsBar({ count }: { count: number }) {
  const full = count >= 16;
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${full ? "border-primary/40 bg-primary/10" : "border-border/60 bg-muted/30"}`}>
      <div className="flex items-center justify-between font-medium">
        <span>{count}/16 tournament slots filled</span>
        <span className="text-muted-foreground">{full ? "Full — editing existing teams still allowed" : `${16 - count} slots remaining`}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (count / 16) * 100)}%` }} />
      </div>
    </div>
  );
}

function RemoveTeamButton({
  teamName,
  inUse,
  onRemove,
}: {
  teamName: string;
  inUse: boolean;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-3" /> Remove team
      </button>
    );
  }
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
      <p className="flex items-start gap-1.5 font-medium">
        <ShieldAlert className="mt-px size-3.5 shrink-0" />
        {inUse
          ? `"${teamName}" appears in scheduled ties. The server will re-point those slots to “to be announced” — but ties with confirmed results block removal entirely. Continue?`
          : `Remove "${teamName}" from the tournament? This cannot be undone.`}
      </p>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            toast.info("Removal cancelled");
          }}
          className="h-6 rounded-md border border-input px-2 text-[0.7rem] hover:bg-muted"
        >
          Keep
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onRemove();
          }}
          className="h-6 rounded-md bg-destructive px-2 text-[0.7rem] font-medium text-white hover:bg-destructive/90"
        >
          Remove team
        </button>
      </div>
    </div>
  );
}
