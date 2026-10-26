import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/server/auth";

/**
 * Route gate for the admin area.
 * - /signin is the only public screen of the panel.
 * - Any other /admin request without a valid, signed session cookie is bounced
 *   there (a forged cookie cannot pass verifySessionToken).
 * - The server-side check lives in the admin layout and in every /api/admin route.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authorised = verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);

  if (pathname.startsWith("/admin") && !authorised) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/signin" && authorised) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/signin"],
};
