import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { StoreError, deleteMatch, readTournament, saveOneMatch, saveMatches } from "@/lib/server/tournament-store";
import type { Match } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

function failure(error: unknown): NextResponse {
  return NextResponse.json(
    { error: error instanceof StoreError ? error.message : ((error as Error)?.message ?? "Save failed.") },
    { status: 500 },
  );
}

function normalise(input: Partial<Match>): Match {
  const stage = input.stage === "qf" || input.stage === "sf" || input.stage === "final" ? input.stage : "r16";
  const status: Match["status"] =
    input.status === "completed" || input.status === "postponed" || input.status === "cancelled"
      ? input.status
      : "scheduled";
  return {
    id: String(input.id ?? ""),
    stage,
    slot: Number.isFinite(Number(input.slot)) ? Number(input.slot) : 1,
    teamAId: typeof input.teamAId === "string" && input.teamAId ? input.teamAId : null,
    teamBId: typeof input.teamBId === "string" && input.teamBId ? input.teamBId : null,
    teamAScore: Number.isFinite(Number(input.teamAScore)) ? Number(input.teamAScore) : null,
    teamBScore: Number.isFinite(Number(input.teamBScore)) ? Number(input.teamBScore) : null,
    teamAPens: Number.isFinite(Number(input.teamAPens)) ? Number(input.teamAPens) : null,
    teamBPens: Number.isFinite(Number(input.teamBPens)) ? Number(input.teamBPens) : null,
    winnerId: typeof input.winnerId === "string" && input.winnerId ? input.winnerId : null,
    status,
    kickoff: typeof input.kickoff === "string" ? input.kickoff : null,
    venue: "Magura Govt. Primary School Play Ground",
    minute: Number.isFinite(Number(input.minute)) ? Number(input.minute) : 0,
    goals: Array.isArray(input.goals) ? input.goals : [],
    cards: Array.isArray(input.cards) ? input.cards : [],
    needsReview: input.needsReview === true,
    reviewNote: typeof input.reviewNote === "string" && input.reviewNote ? input.reviewNote : null,
  };
}

/** Save one manually scheduled match (create or update). */
export async function POST(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { match?: Partial<Match> };
  try {
    body = (await request.json()) as { match?: Partial<Match> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.match || !body.match.id) {
    return NextResponse.json({ error: "A match with an id is required." }, { status: 400 });
  }

  try {
    const { match, flagged } = await saveOneMatch(normalise(body.match));
    return NextResponse.json({ ok: true, match, flagged, savedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof StoreError) return NextResponse.json({ error: error.message }, { status: 400 });
    return failure(error);
  }
}

/** Persist a whole bracket snapshot (used by Publish and by Reset). */
export async function PUT(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { matches?: Partial<Match>[] };
  try {
    body = (await request.json()) as { matches?: Partial<Match>[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.matches) || body.matches.length === 0) {
    return NextResponse.json({ error: "At least one match is required." }, { status: 400 });
  }

  try {
    const data = await readTournament({ seedIfEmpty: false });
    const byId = new Map(data.matches.map((match) => [match.id, match]));
    body.matches.forEach((incoming) => {
      if (!incoming.id) return;
      const existing = byId.get(incoming.id);
      byId.set(incoming.id, existing ? { ...existing, ...normalise({ ...existing, ...incoming }) } : normalise(incoming));
    });
    const { matches, flagged } = await saveMatches([...byId.values()]);
    return NextResponse.json({ ok: true, matches, flagged, savedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof StoreError) return NextResponse.json({ error: error.message }, { status: 400 });
    return failure(error);
  }
}

/** Clear one slot (?id=r16-1) back to "to be announced". */
export async function DELETE(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  try {
    if (id) {
      const match = await deleteMatch(id);
      return NextResponse.json({ ok: true, match, savedAt: new Date().toISOString() });
    }
    const data = await readTournament({ seedIfEmpty: false });
    const cleared = data.matches.map((match) => ({
      ...match,
      teamAId: null,
      teamBId: null,
      teamAScore: null,
      teamBScore: null,
      teamAPens: null,
      teamBPens: null,
      winnerId: null,
      status: "scheduled" as const,
      minute: 0,
      goals: [],
      cards: [],
      kickoff: null,
      needsReview: false,
      reviewNote: null,
    }));
    const { matches } = await saveMatches(cleared);
    return NextResponse.json({ ok: true, matches, savedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof StoreError) return NextResponse.json({ error: error.message }, { status: 400 });
    return failure(error);
  }
}
