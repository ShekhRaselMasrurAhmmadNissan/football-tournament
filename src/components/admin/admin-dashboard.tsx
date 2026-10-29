"use client";

import * as React from "react";
import Link from "next/link";
import { Award, CalendarClock, ExternalLink, Loader2, LogOut, Save, Settings2, ShieldCheck, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useAdminApi } from "@/components/admin/admin-api";
import { AdminMatches } from "@/components/admin/admin-matches";
import { AdminSettings } from "@/components/admin/admin-settings";
import { AdminTeams } from "@/components/admin/admin-teams";
import type { TournamentFile } from "@/lib/server/tournament-store";

export type SaveState = { status: "idle" | "saving" | "saved" | "error"; message?: string; at?: string };

async function fetchState(): Promise<TournamentFile | null> {
  return fetch("/api/admin/state", { cache: "no-store" })
    .then((response) => (response.ok ? (response.json() as Promise<TournamentFile>) : null))
    .catch(() => null);
}

export function AdminDashboard({
  initial,
  initialTab = "matches",
}: {
  initial: TournamentFile;
  initialTab?: "matches" | "teams" | "settings";
}) {
  const api = useAdminApi();
  const [tab, setTab] = React.useState(initialTab);
  const [data, setData] = React.useState<TournamentFile>(initial);
  const [state, setState] = React.useState<SaveState>({ status: "idle" });
  const [baseline, setBaseline] = React.useState<TournamentFile>(initial);

  const dirty =
    JSON.stringify(data.matches) !== JSON.stringify(baseline.matches) ||
    JSON.stringify(data.teams) !== JSON.stringify(baseline.teams) ||
    JSON.stringify(data.config) !== JSON.stringify(baseline.config) ||
    JSON.stringify(data.venues) !== JSON.stringify(baseline.venues);

  function adopt(fresh: TournamentFile) {
    setData(fresh);
    setBaseline(fresh);
  }

  async function refresh() {
    const fresh = await fetchState();
    if (fresh) adopt(fresh);
  }

  async function handleSave() {
    setState({ status: "saving" });
    const results = await Promise.all([
      api.saveMatches(data.matches),
      api.saveSettings({ config: data.config, venues: data.venues }),
      api.saveTeams({ teams: data.teams }),
    ]);
    const failure = results.find((result) => !result.ok);
    if (failure) {
      setState({ status: "error", message: failure.error ?? "Save failed." });
      toast.error("Save failed", { description: failure.error ?? "The database could not be written." });
      await refresh();
      return;
    }
    setState({ status: "saved", at: new Date().toLocaleTimeString("en-GB", { hour12: false }) });
    const fresh = await fetchState();
    if (fresh) adopt(fresh);
    toast.success("Everything saved", {
      description: `${data.matches.filter((match) => match.status === "completed").length} completed ties, ${data.teams.length} teams and the tournament settings are live.`,
    });
  }

  /** Publish the bracket draft exactly as staged on screen. */
  async function handlePublish(draft: TournamentFile["matches"]): Promise<boolean> {
    setState({ status: "saving" });
    const toastId = toast.loading("Saving results…");
    const result = await api.saveMatches(draft);

    if (!result.ok) {
      setState({ status: "error", message: result.error ?? "Publish failed." });
      toast.error("Save failed", { id: toastId, description: result.error ?? "The database could not be written." });
      await refresh();
      return false;
    }

    const stamped = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setState({ status: "saved", at: stamped });

    const fresh = await fetchState();
    if (fresh) {
      setData((current) => ({ ...current, matches: fresh.matches }));
      setBaseline((current) => ({ ...current, matches: fresh.matches }));
    }

    const played = draft.filter((match) => match.status === "completed").length;
    toast.success("Results saved", { id: toastId, description: `${played} of ${draft.length} ties completed · ${stamped}` });
    return true;
  }

  async function handleAddTeam() {
    const name = window.prompt("New team name (slot " + (data.teams.length + 1) + " of 16):");
    if (!name || !name.trim()) return;
    const result = await api.addTeam({ name: name.trim() });
    if (!result.ok) {
      setState({ status: "error", message: result.error });
      toast.error("Could not add team", { description: result.error });
      return;
    }
    const fresh = await fetchState();
    if (fresh) adopt(fresh);
    toast.success("Team added", { description: `${name.trim()} joined the tournament.` });
  }

  async function handleRemoveTeam(teamId: string) {
    const result = await api.removeTeam(teamId);
    if (!result.ok) {
      setState({ status: "error", message: result.error });
      toast.error("Could not remove team", { description: result.error });
      return;
    }
    const fresh = await fetchState();
    if (fresh) adopt(fresh);
    toast.success("Team removed");
  }

  React.useEffect(() => {
    if (state.status !== "saved") return;
    const timer = setTimeout(() => setState({ status: "idle" }), 4000);
    return () => clearTimeout(timer);
  }, [state.status]);

  const usedTeamIds = React.useMemo(
    () => new Set(data.matches.flatMap((match) => [match.teamAId, match.teamBId].filter(Boolean) as string[])),
    [data.matches],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3">
        <BrandLogo size={42} withText={false} href={null} />
        <div className="min-w-0">
          <h1 className="font-heading text-base font-semibold tracking-tight">Organiser control room</h1>
          <p className="text-[0.7rem] text-muted-foreground">
            Manual scheduling only — every team and kickoff is chosen by hand
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-medium sm:inline-flex ${
              dirty ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary"
            }`}
          >
            <ShieldCheck className="size-3" />
            {dirty ? "Unsaved changes" : state.status === "saved" ? `Saved ${state.at ?? ""}` : "All changes saved"}
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href="/" target="_blank">
              <ExternalLink /> View site
            </Link>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={state.status === "saving" || !dirty}>
            {state.status === "saving" ? <Loader2 className="animate-spin" /> : <Save />}
            {state.status === "saving" ? "Saving…" : "Save changes"}
          </Button>
          <ThemeToggle />
          <Button size="sm" variant="ghost" onClick={() => void api.logout()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      {state.status === "error" && (
        <div className="mt-3 flex flex-wrap items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          <span className="flex-1">{state.message}</span>
          <button
            type="button"
            className="rounded-md border border-destructive/40 px-2 py-0.5 text-[0.7rem] hover:bg-destructive/10"
            onClick={() => setState({ status: "idle" })}
          >
            Dismiss
          </button>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="mt-4">
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="matches">
            <Swords className="size-3.5" /> Matches
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="size-3.5" /> Teams
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="size-3.5" /> Settings
          </TabsTrigger>
          <TabsTrigger value="prizes">
            <Award className="size-3.5" /> Prizes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <AdminMatches
            matches={data.matches}
            teams={data.teams}
            onPublish={handlePublish}
            onResetBracket={async () => {
              const result = await api.resetBracket();
              if (!result.ok) {
                setState({ status: "error", message: result.error });
                return;
              }
              await refresh();
              toast.success("Bracket reset", { description: "All ties are back to “to be announced”." });
            }}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <AdminTeams
            teams={data.teams}
            onChange={(teams) => setData((current) => ({ ...current, teams }))}
            onAddTeam={handleAddTeam}
            onRemoveTeam={handleRemoveTeam}
            usedTeamIds={usedTeamIds}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <AdminSettings
            mode="general"
            config={data.config}
            venues={data.venues}
            onChange={(config, venues) => setData((current) => ({ ...current, config, venues }))}
          />
        </TabsContent>

        <TabsContent value="prizes" className="mt-4">
          <AdminSettings
            mode="prizes"
            config={data.config}
            venues={data.venues}
            onChange={(config, venues) => setData((current) => ({ ...current, config, venues }))}
          />
        </TabsContent>
      </Tabs>

      <footer className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[0.7rem] text-muted-foreground">
        <CalendarClock className="size-3.5" />
        Changes take effect on the public website immediately after saving.
      </footer>
    </div>
  );
}
