import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken, verifyPassword } from "@/lib/server/auth";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    // Small delay to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json({ error: "Wrong password. Try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
