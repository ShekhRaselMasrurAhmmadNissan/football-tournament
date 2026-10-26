import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { StoreError, loadOrRepair, writeTournament } from "@/lib/server/tournament-store";
import type { Match, Player, PlayerPosition, Team } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

function sanitiseSquad(raw: unknown, teamId: string): Player[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const player = item as Partial<Player>;
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

/** Replace the 16-team list (names, colours, managers, squads) in the data file. */
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

  if (!Array.isArray(body.teams) || body.teams.length !== 16) {
    return NextResponse.json({ error: "Exactly 16 teams are required for this bracket." }, { status: 400 });
  }

  let data;
  try {
    data = await loadOrRepair();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : "Could not read the data file." },
      { status: 500 },
    );
  }
  const existing = new Map(data.teams.map((team) => [team.id, team]));

  const teams: Team[] = body.teams.map((raw, index) => {
    const team = raw as Partial<Team>;
    const id = String(team.id ?? `t${index + 1}`);
    const fallback = existing.get(id);
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
    } satisfies Team;
  });

  // Keep every team id used by the bracket valid: re-point orphaned slots to null.
  const validIds = new Set(teams.map((team) => team.id));
  const matches: Match[] = data.matches.map((match) => ({
    ...match,
    homeId: match.homeId && validIds.has(match.homeId) ? match.homeId : null,
    awayId: match.awayId && validIds.has(match.awayId) ? match.awayId : null,
  }));

  try {
    await writeTournament({ ...data, teams, matches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : "Could not write the data file." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, teams, matches, savedAt: new Date().toISOString() });
}
