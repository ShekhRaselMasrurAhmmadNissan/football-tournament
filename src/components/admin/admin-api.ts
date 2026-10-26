"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/lib/types";

export interface AdminApi {
  saveMatches: (matches: Match[]) => Promise<{ ok: boolean; error?: string }>;
  resetBracket: () => Promise<{ ok: boolean; error?: string }>;
  saveSettings: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
  saveTeams: (payload: unknown) => Promise<{ ok: boolean; error?: string }>;
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

export function useAdminApi(): AdminApi {
  const router = useRouter();
  const saveMatches = React.useCallback(async (matches: Match[]) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/matches", "PUT", { matches });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }, []);

  const resetBracket = React.useCallback(async () => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/matches", "DELETE");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }, []);

  const saveSettings = React.useCallback(async (payload: unknown) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/tournament", "PUT", payload);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }, []);

  const saveTeams = React.useCallback(async (payload: unknown) => {
    try {
      await apiCall<{ ok: boolean }>("/api/admin/teams", "PUT", payload);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }, []);

  const logout = React.useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }, [router]);

  return { saveMatches, resetBracket, saveSettings, saveTeams, logout };
}
