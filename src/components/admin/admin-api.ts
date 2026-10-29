"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Match, Team } from "@/lib/types";

export interface AdminApi {
  saveMatches: (matches: Match[]) => Promise<{ ok: boolean; error?: string }>;
  saveMatch: (match: Partial<Match>) => Promise<{ ok: boolean; error?: string; flagged?: string[] }>;
  clearMatch: (id: string) => Promise<{ ok: boolean; error?: string }>;
  resetBracket: () => Promise<{ ok: boolean; error?: string }>;
  saveSettings: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
  saveTeams: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
  addTeam: (team: Partial<Team>) => Promise<{ ok: boolean; error?: string }>;
  removeTeam: (id: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export async function apiCall<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function errorOf(error: unknown): { ok: false; error: string } {
  return { ok: false as const, error: (error as Error).message };
}

export function useAdminApi(): AdminApi {
  const router = useRouter();

  const saveMatches = React.useCallback(async (matches: Match[]) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/matches", "PUT", { matches });
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const saveMatch = React.useCallback(async (match: Partial<Match>) => {
    try {
      const result = await apiCall<{ ok: boolean; flagged?: string[] }>("/api/admin/matches", "POST", { match });
      return { ok: true as const, flagged: result.flagged ?? [] };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const clearMatch = React.useCallback(async (id: string) => {
    try {
      await apiCall<{ ok: boolean }>(`/api/admin/matches?id=${encodeURIComponent(id)}`, "DELETE");
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const resetBracket = React.useCallback(async () => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/matches", "DELETE");
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const saveSettings = React.useCallback(async (payload: unknown) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/tournament", "PUT", payload);
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const saveTeams = React.useCallback(async (payload: unknown) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/teams", "PUT", payload);
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const addTeam = React.useCallback(async (team: Partial<Team>) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/teams", "POST", { team });
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const removeTeam = React.useCallback(async (id: string) => {
    try {
      await apiCall<{ ok: boolean }>(`/api/admin/teams?id=${encodeURIComponent(id)}`, "DELETE");
      return { ok: true as const };
    } catch (error) {
      return errorOf(error);
    }
  }, []);

  const logout = React.useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }, [router]);

  return { saveMatches, saveMatch, clearMatch, resetBracket, saveSettings, saveTeams, addTeam, removeTeam, logout };
}
