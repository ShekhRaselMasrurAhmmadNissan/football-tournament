import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdminSession(): Promise<boolean> {
  return isAdminSession();
}
