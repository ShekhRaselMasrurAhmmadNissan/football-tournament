import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";
import { readTournament } from "@/lib/server/tournament-store";

/** Fresh copy of the saved tournament data, used by the admin UI after a save. */
export async function GET() {
  const store = await cookies();
  if (!verifySessionToken(store.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  const data = await readTournament();
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
