import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { FIXED_VENUE, StoreError, readTournament, saveConfig } from "@/lib/server/tournament-store";
import type { Award, TournamentConfig, Venue } from "@/lib/types";

async function isAuthorised(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

function text(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return candidate.length > 0 ? candidate : fallback;
}

function sanitiseAwards(input: unknown, current: Award[]): Award[] {
  if (!Array.isArray(input)) return current;
  return (input as Partial<Award>[])
    .map((award, index) => {
      const title = String(award.title ?? "").trim();
      if (!title) return null;
      return {
        id: String(award.id ?? `award-${index + 1}`),
        title,
        recipient: typeof award.recipient === "string" && award.recipient.trim() ? award.recipient.trim() : null,
        note: String(award.note ?? ""),
      } satisfies Award;
    })
    .filter((award): award is Award => award !== null);
}

function sanitiseConfig(input: Partial<TournamentConfig>, current: TournamentConfig): TournamentConfig {
  const safe: TournamentConfig = {
    name: text(current?.name, "Tournament"),
    edition: text(current?.edition, "2026"),
    organiser: text(current?.organiser, "Organising Committee"),
    kickoff: text(current?.kickoff, new Date().toISOString()),
    finalDate: text(current?.finalDate, new Date().toISOString()),
    prizePool: Number.isFinite(Number(current?.prizePool)) ? Number(current?.prizePool) : 0,
    format: text(current?.format, "16 teams · Single elimination"),
    venue: FIXED_VENUE,
    championPrize: Number.isFinite(Number(current?.championPrize)) ? Number(current?.championPrize) : 50000,
    runnerUpPrize: Number.isFinite(Number(current?.runnerUpPrize)) ? Number(current?.runnerUpPrize) : 40000,
    awards: Array.isArray(current?.awards) ? current.awards : [],
  };

  const championPrize = Number.isFinite(Number(input.championPrize)) ? Number(input.championPrize) : safe.championPrize;
  const runnerUpPrize = Number.isFinite(Number(input.runnerUpPrize)) ? Number(input.runnerUpPrize) : safe.runnerUpPrize;

  return {
    name: text(input.name, safe.name),
    edition: text(input.edition, safe.edition),
    organiser: text(input.organiser, safe.organiser),
    kickoff: text(input.kickoff, safe.kickoff),
    finalDate: text(input.finalDate, safe.finalDate),
    prizePool: championPrize + runnerUpPrize,
    format: text(input.format, safe.format),
    venue: FIXED_VENUE,
    championPrize,
    runnerUpPrize,
    awards: sanitiseAwards(input.awards, safe.awards),
  };
}

/** Update tournament settings, prize money and award titles in MongoDB. */
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
    const data = await readTournament({ seedIfEmpty: false });
    const config = sanitiseConfig(body.config ?? {}, data.config);
    const venues: Venue[] = data.venues.length
      ? data.venues
      : [{ id: "v1", name: FIXED_VENUE, city: "Magura", capacity: 0, surface: "" }];

    await saveConfig(config, venues);

    return NextResponse.json({ ok: true, config, venues, savedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof StoreError ? error.message : ((error as Error)?.message ?? "Save failed.") },
      { status: 400 },
    );
  }
}
