"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIXED_VENUE } from "@/lib/venues";
import type { Award, TournamentConfig, Venue } from "@/lib/types";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${date.getDate()}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatBDT(value: number): string {
  return `৳${Number(value || 0).toLocaleString("en-IN")}`;
}

export function AdminSettings({
  mode,
  config,
  venues,
  onChange,
}: {
  mode: "general" | "prizes";
  config: TournamentConfig;
  venues: Venue[];
  onChange: (config: TournamentConfig, venues: Venue[]) => void;
}) {
  function patchConfig(changes: Partial<TournamentConfig>) {
    onChange({ ...config, ...changes, venue: FIXED_VENUE }, venues);
  }

  function patchAward(id: string, changes: Partial<Award>) {
    onChange(
      {
        ...config,
        awards: config.awards.map((award) => (award.id === id ? { ...award, ...changes } : award)),
      },
      venues,
    );
  }

  function addAward() {
    onChange(
      {
        ...config,
        awards: [
          ...config.awards,
          { id: `award-${Date.now()}`, title: "New award", recipient: null, note: "" },
        ],
      },
      venues,
    );
  }

  if (mode === "prizes") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prize money</CardTitle>
            <CardDescription>Official cash prizes — shown on the public trophies section.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Champion (৳)">
              <Input
                type="number"
                value={config.championPrize}
                onChange={(event) => patchConfig({ championPrize: Number(event.target.value) || 0 })}
              />
            </Field>
            <Field label="Runner-up (৳)">
              <Input
                type="number"
                value={config.runnerUpPrize}
                onChange={(event) => patchConfig({ runnerUpPrize: Number(event.target.value) || 0 })}
              />
            </Field>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Public display: Champion <strong className="text-foreground">{formatBDT(config.championPrize)}</strong> · Runner-up{" "}
              <strong className="text-foreground">{formatBDT(config.runnerUpPrize)}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other awards</CardTitle>
            <CardDescription>
              Title, recipient and notes only — no cash values, exactly as confirmed by the committee.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(config.awards ?? []).map((award) => (
              <div key={award.id} className="grid grid-cols-[1fr_auto] gap-1.5 rounded-md border border-border/60 p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <Field label="Title">
                    <Input
                      value={award.title}
                      onChange={(event) => patchAward(award.id, { title: event.target.value })}
                      className="h-7 text-xs"
                    />
                  </Field>
                  <Field label="Recipient (empty = not awarded yet)">
                    <Input
                      value={award.recipient ?? ""}
                      onChange={(event) => patchAward(award.id, { recipient: event.target.value.trim() ? event.target.value.trim() : null })}
                      className="h-7 text-xs"
                      placeholder="To be announced"
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Note">
                      <Input
                        value={award.note}
                        onChange={(event) => patchAward(award.id, { note: event.target.value })}
                        className="h-7 text-xs"
                      />
                    </Field>
                  </div>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onChange({ ...config, awards: config.awards.filter((item) => item.id !== award.id) }, venues)}
                  aria-label="Remove award"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button size="xs" variant="outline" onClick={addAward}>
              <Plus /> Add award
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tournament settings</CardTitle>
          <CardDescription>Headlines, dates and format shown across the site.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Tournament name" full>
            <Input value={config.name} onChange={(event) => patchConfig({ name: event.target.value })} />
          </Field>
          <Field label="Edition">
            <Input value={config.edition} onChange={(event) => patchConfig({ edition: event.target.value })} />
          </Field>
          <Field label="Organiser">
            <Input value={config.organiser} onChange={(event) => patchConfig({ organiser: event.target.value })} />
          </Field>
          <Field label="First kickoff">
            <Input
              type="datetime-local"
              value={toLocalInput(config.kickoff)}
              onChange={(event) => patchConfig({ kickoff: fromLocalInput(event.target.value) })}
            />
          </Field>
          <Field label="Final">
            <Input
              type="datetime-local"
              value={toLocalInput(config.finalDate)}
              onChange={(event) => patchConfig({ finalDate: fromLocalInput(event.target.value) })}
            />
          </Field>
          <Field label="Format label">
            <Input value={config.format} onChange={(event) => patchConfig({ format: event.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Venue is fixed: <strong className="text-foreground">{FIXED_VENUE}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue</CardTitle>
          <CardDescription>A single fixed ground for the whole tournament.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium">{FIXED_VENUE}</p>
          <p className="text-[0.7rem] text-muted-foreground">
            No venue selection — every match, everywhere on the site, shows this ground.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "space-y-1 sm:col-span-2" : "space-y-1"}>
      <Label className="text-[0.65rem] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
