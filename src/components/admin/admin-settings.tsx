"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TournamentConfig, Venue } from "@/lib/types";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function AdminSettings({
  config,
  venues,
  onChange,
}: {
  config: TournamentConfig;
  venues: Venue[];
  onChange: (config: TournamentConfig, venues: Venue[]) => void;
}) {
  function patchConfig(changes: Partial<TournamentConfig>) {
    onChange({ ...config, ...changes }, venues);
  }

  function patchVenue(id: string, changes: Partial<Venue>) {
    onChange(config, venues.map((venue) => (venue.id === id ? { ...venue, ...changes } : venue)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tournament settings</CardTitle>
          <CardDescription>Headlines, dates and prize money shown across the site.</CardDescription>
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
          <Field label="Prize pool (৳)">
            <Input
              type="number"
              value={config.prizePool}
              onChange={(event) => patchConfig({ prizePool: Number(event.target.value) || 0 })}
            />
          </Field>
          <Field label="Format label">
            <Input value={config.format} onChange={(event) => patchConfig({ format: event.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
          <CardDescription>Grounds available when assigning a fixture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {venues.map((venue) => (
            <div key={venue.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 rounded-md border border-border/60 p-2">
              <div className="col-span-3 grid grid-cols-2 gap-1.5">
                <Field label="Name">
                  <Input
                    value={venue.name}
                    onChange={(event) => patchVenue(venue.id, { name: event.target.value })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={venue.city}
                    onChange={(event) => patchVenue(venue.id, { city: event.target.value })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="Capacity">
                  <Input
                    type="number"
                    value={venue.capacity}
                    onChange={(event) => patchVenue(venue.id, { capacity: Number(event.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </Field>
                <Field label="Surface">
                  <Input
                    value={venue.surface}
                    onChange={(event) => patchVenue(venue.id, { surface: event.target.value })}
                    className="h-7 text-xs"
                  />
                </Field>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                className="col-start-3"
                onClick={() => onChange(config, venues.filter((item) => item.id !== venue.id))}
                aria-label="Remove venue"
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              onChange(config, [
                ...venues,
                {
                  id: `v${Date.now()}`,
                  name: "New ground",
                  city: "",
                  capacity: 5000,
                  surface: "Natural grass",
                },
              ])
            }
          >
            <Plus /> Add venue
          </Button>
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
