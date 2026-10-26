import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { StoreError, loadOrRepair, writeTournament } from "@/lib/server/tournament-store";
import type { TournamentConfig, Venue } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

function text(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return candidate.length > 0 ? candidate : fallback;
}

function sanitiseConfig(input: Partial<TournamentConfig>, current: TournamentConfig): TournamentConfig {
  const safeCurrent: TournamentConfig = {
    name: text(current?.name, "Tournament"),
    edition: text(current?.edition, "2026"),
    organiser: text(current?.organiser, "Organising Committee"),
    kickoff: text(current?.kickoff, new Date().toISOString()),
    finalDate: text(current?.finalDate, new Date().toISOString()),
    prizePool: Number.isFinite(Number(current?.prizePool)) ? Number(current?.prizePool) : 0,
    format: text(current?.format, "16 teams · Single elimination"),
  };

  return {
    name: text(input.name, safeCurrent.name),
    edition: text(input.edition, safeCurrent.edition),
    organiser: text(input.organiser, safeCurrent.organiser),
    kickoff: text(input.kickoff, safeCurrent.kickoff),
    finalDate: text(input.finalDate, safeCurrent.finalDate),
    prizePool: Number.isFinite(Number(input.prizePool)) ? Number(input.prizePool) : safeCurrent.prizePool,
    format: text(input.format, safeCurrent.format),
  };
}

function sanitiseVenues(input: unknown, current: Venue[]): Venue[] {
  if (!Array.isArray(input)) return current;
  const venues = input
    .map((raw, index) => {
      const venue = raw as Partial<Venue>;
      const name = String(venue.name ?? "").trim();
      if (!name) return null;
      return {
        id: String(venue.id ?? `v${index + 1}`),
        name,
        city: String(venue.city ?? "").trim(),
        capacity: Number.isFinite(Number(venue.capacity)) ? Number(venue.capacity) : 0,
        surface: String(venue.surface ?? "").trim(),
      } satisfies Venue;
    })
    .filter((venue): venue is Venue => venue !== null);
  return venues.length ? venues : current;
}

/** Update tournament settings (name, edition, dates, prize money) and the venue list. */
export async function PUT(request: Request) {
  if (!(await isAuthorised())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { config?: Partial<TournamentConfig>; venues?: unknown };
  try {
    body = (await request.json()) as { config?: Partial<TournamentConfig>; venues?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const data = await loadOrRepair();
    const config = sanitiseConfig(body.config ?? {}, data.config);
    const venues = body.venues === undefined ? data.venues : sanitiseVenues(body.venues, data.venues);

    await writeTournament({ ...data, config, venues });

    return NextResponse.json({ ok: true, config, venues, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : "Could not write the data file." },
      { status: 500 },
    );
  }
}
