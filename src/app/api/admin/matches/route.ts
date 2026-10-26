import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { StoreError, loadOrRepair, writeTournament } from "@/lib/server/tournament-store";
import { resolveBracket } from "@/lib/tournament-engine";
import type { Match } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/** Persist the matches array back into src/data/tournament-data.ts. */
export async function PUT(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { matches?: Match[] };
  try {
    body = (await request.json()) as { matches?: Match[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.matches) || body.matches.length !== 15) {
    return NextResponse.json({ error: "A complete 15-match bracket is required." }, { status: 400 });
  }

  try {
    const data = await loadOrRepair();
    const resolved = resolveBracket(body.matches);
    await writeTournament({ ...data, matches: resolved });

    return NextResponse.json({ ok: true, matches: resolved, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : "Could not write the data file." },
      { status: 500 },
    );
  }
}

/** Rebuild the bracket from the current team list, wiping all results. */
export async function DELETE() {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const data = await loadOrRepair();
    const { buildBlankBracket } = await import("@/lib/server/tournament-store");
    const matches = buildBlankBracket(data.teams, data.venues, data.config.kickoff);
    await writeTournament({ ...data, matches });

    return NextResponse.json({ ok: true, matches, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : "Could not write the data file." },
      { status: 500 },
    );
  }
}
