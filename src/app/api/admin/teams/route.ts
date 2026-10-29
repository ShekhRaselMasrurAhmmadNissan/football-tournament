import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { MAX_TEAMS, StoreError, readTournament, removeTeam, saveTeams } from "@/lib/server/tournament-store";
import type { Match, Player, PlayerPosition, Team } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

function sanitiseSquad(raw: unknown, teamId: string): Player[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Partial<Player>[])
    .map((player, index) => {
      const name = String(player.name ?? "").trim();
      if (!name) return null;
      const position = POSITIONS.includes(player.position as PlayerPosition)
        ? (player.position as PlayerPosition)
        : "MF";
      return {
        id: String(player.id ?? `${teamId}-p${index + 1}`),
        name,
        position,
        shirt: Number.isFinite(Number(player.shirt)) ? Number(player.shirt) : index + 1,
      } satisfies Player;
    })
    .filter((player): player is Player => player !== null);
}

function sanitiseTeam(team: Partial<Team>, index: number, existing?: Team): Team {
  const id = String(team.id ?? `t${Date.now()}-${index + 1}`);
  const fallback = existing;
  const name = String(team.name ?? fallback?.name ?? `Team ${index + 1}`).trim();
  return {
    id,
    name,
    shortName: String(team.shortName ?? fallback?.shortName ?? name.slice(0, 3)).toUpperCase().slice(0, 4),
    city: String(team.city ?? fallback?.city ?? "").trim(),
    manager: String(team.manager ?? fallback?.manager ?? "").trim(),
    founded: Number.isFinite(Number(team.founded)) ? Number(team.founded) : (fallback?.founded ?? 2000),
    primary: String(team.primary ?? fallback?.primary ?? "#d4a017"),
    accent: String(team.accent ?? fallback?.accent ?? "#fde68a"),
    crest: String(team.crest ?? fallback?.crest ?? name.slice(0, 2)).toUpperCase().slice(0, 3),
    squad: sanitiseSquad(team.squad, id),
  };
}

/** Save the whole team list (client + server both enforce the 16-team cap). */
export async function PUT(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { teams?: unknown };
  try {
    body = (await request.json()) as { teams?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.teams)) {
    return NextResponse.json({ error: "A teams array is required." }, { status: 400 });
  }

  if (body.teams.length > MAX_TEAMS) {
    return NextResponse.json({ error: `Only ${MAX_TEAMS} teams are allowed — no more slots left.` }, { status: 400 });
  }

  try {
    const data = await readTournament({ seedIfEmpty: false });
    const existing = new Map(data.teams.map((team) => [team.id, team]));
    const teams: Team[] = (body.teams as Partial<Team>[]).map((team, index) => sanitiseTeam(team, index, existing.get(String(team.id))));

    // Editing teams must never corrupt confirmed results — drop stale references only.
    const validIds = new Set(teams.map((team) => team.id));
    const matches: Match[] = data.matches.map((match) => ({
      ...match,
      teamAId: match.teamAId && validIds.has(match.teamAId) ? match.teamAId : null,
      teamBId: match.teamBId && validIds.has(match.teamBId) ? match.teamBId : null,
    }));

    await saveTeams(teams);
    const { saveMatches } = await import("@/lib/server/tournament-store");
    await saveMatches(matches);

    return NextResponse.json({ ok: true, teams, matches, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : ((error as Error)?.message ?? "Save failed.") },
      { status: 400 },
    );
  }
}

/** Add one team (POST { team }) — rejected when all 16 slots are full. */
export async function POST(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { team?: Partial<Team> };
  try {
    body = (await request.json()) as { team?: Partial<Team> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.team || !String(body.team.name ?? "").trim()) {
    return NextResponse.json({ error: "A team name is required." }, { status: 400 });
  }

  try {
    const data = await readTournament({ seedIfEmpty: false });
    if (data.teams.length >= MAX_TEAMS) {
      return NextResponse.json({ error: `All ${MAX_TEAMS} slots are filled — remove a team before adding one.` }, { status: 400 });
    }
    const teams = [...data.teams, sanitiseTeam(body.team, data.teams.length)];
    await saveTeams(teams);
    return NextResponse.json({ ok: true, teams, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : ((error as Error)?.message ?? "Save failed.") },
      { status: 400 },
    );
  }
}

/** Remove one team (?id=t3) — refused when confirmed results depend on it. */
export async function DELETE(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A team id is required." }, { status: 400 });

  try {
    await removeTeam(id);
    const data = await readTournament({ seedIfEmpty: false });
    return NextResponse.json({ ok: true, teams: data.teams, matches: data.matches, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : ((error as Error)?.message ?? "Save failed.") },
      { status: 400 },
    );
  }
}
