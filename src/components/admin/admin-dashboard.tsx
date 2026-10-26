"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, Loader2, LogOut, Save, Settings2, ShieldCheck, Swords, Users } from "lucide-react";
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
  const [viewKey, setViewKey] = React.useState(0);

  const dirty =
    JSON.stringify(data.matches) !== JSON.stringify(baseline.matches) ||
    JSON.stringify(data.teams) !== JSON.stringify(baseline.teams) ||
    JSON.stringify(data.config) !== JSON.stringify(baseline.config) ||
    JSON.stringify(data.venues) !== JSON.stringify(baseline.venues);

  function reloadFromServer(fresh: TournamentFile) {
    setData(fresh);
    setBaseline(fresh);
    setViewKey((key) => key + 1);
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
      toast.error("Save failed", { description: failure.error ?? "The data file could not be written." });
      return;
    }
    setState({ status: "saved", at: new Date().toLocaleTimeString("en-GB", { hour12: false }) });
    const fresh = await fetch("/api/admin/state", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<TournamentFile>) : null))
      .catch(() => null);
    if (fresh) reloadFromServer(fresh);
    toast.success("Everything saved", {
      description: `${data.matches.filter((match) => match.status === "finished").length} results, ${data.teams.length} teams and the tournament settings are live.`,
    });
  }

  /**
   * Publish the bracket exactly as it is on screen.
   * The server re-resolves the winners, so we adopt *its* copy as the new baseline
   * instead of remounting the editor — that is what used to roll the data back.
   */
  async function handlePublish(draft: TournamentFile["matches"]): Promise<boolean> {
    setState({ status: "saving" });
    const toastId = toast.loading("Saving results…");
    const result = await api.saveMatches(draft);

    if (!result.ok) {
      setState({ status: "error", message: result.error ?? "Save failed." });
      toast.error("Save failed", { id: toastId, description: result.error ?? "The data file could not be written." });
      return false;
    }

    const stamped = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setState({ status: "saved", at: stamped });

    const fresh = await fetch("/api/admin/state", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<TournamentFile>) : null))
      .catch(() => null);

    if (fresh) {
      setData((current) => ({ ...current, matches: fresh.matches }));
      setBaseline((current) => ({ ...current, matches: fresh.matches }));
    } else {
      setData((current) => ({ ...current, matches: draft }));
      setBaseline((current) => ({ ...current, matches: draft }));
    }

    const played = draft.filter((match) => match.status === "finished").length;
    toast.success("Results saved", {
      id: toastId,
      description: `${played} of ${draft.length} ties decided · ${stamped}`,
    });
    return true;
  }

  React.useEffect(() => {
    if (state.status !== "saved") return;
    const timer = setTimeout(() => setState({ status: "idle" }), 4000);
    return () => clearTimeout(timer);
  }, [state.status]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3">
        <BrandLogo size={42} withText={false} href={null} />
        <div className="min-w-0">
          <h1 className="font-heading text-base font-semibold tracking-tight">Organiser control room</h1>
          <p className="text-[0.7rem] text-muted-foreground">
            Match results, fixtures and clubs — published straight to the live site
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
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <AdminMatches
            key={viewKey}
            matches={data.matches}
            teams={data.teams}
            venues={data.venues}
            onPublish={handlePublish}
            onResetBracket={async () => {
              const result = await api.resetBracket();
              if (!result.ok) {
                setState({ status: "error", message: result.error });
                return;
              }
              const fresh = await fetch("/api/admin/state", { cache: "no-store" })
                .then((response) => (response.ok ? (response.json() as Promise<TournamentFile>) : null))
                .catch(() => null);
              if (fresh) reloadFromServer(fresh);
            }}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <AdminTeams
            teams={data.teams}
            onChange={(teams) => setData((current) => ({ ...current, teams }))}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <AdminSettings
            config={data.config}
            venues={data.venues}
            onChange={(config, venues) => setData((current) => ({ ...current, config, venues }))}
          />
        </TabsContent>
      </Tabs>

      <footer className="mt-6 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[0.7rem] text-muted-foreground">
        <CalendarClock className="size-3.5" />
        Changes take effect on the public site immediately after saving (the bracket is re-read on every request).
      </footer>
    </div>
  );
}
