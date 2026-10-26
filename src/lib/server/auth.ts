import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "mgfc_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export { COOKIE_NAME };

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "magura-golden-cup-dev-secret-change-me";
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Password comes from ADMIN_PASSWORD_HASH (sha256) or ADMIN_PASSWORD. */
export function verifyPassword(password: string): boolean {
  const hashed = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;
  if (hashed) return safeEqual(hashPassword(password), hashed.toLowerCase());
  if (plain) return safeEqual(password, plain);
  // No credentials configured: fall back to the documented default so the panel is never locked out.
  return safeEqual(password, "magura2026");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expires}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expires, signature] = parts;
  if (role !== "admin") return false;
  const expected = createHmac("sha256", secret()).update(`${role}.${expires}`).digest("hex");
  if (!safeEqual(signature, expected)) return false;
  return Number(expires) > Date.now();
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
