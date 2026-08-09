import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

const ROLE_ROUTE_PREFIXES: Record<string, string[]> = {
  "/scan": ["VOLUNTEER", "DOCTOR"],
  "/dispatch": ["DISPATCHER"],
  "/responder": ["RESPONDER"],
  "/admin": ["ADMIN"],
  "/register": ["VOLUNTEER", "DOCTOR", "DISPATCHER", "ADMIN"],
};

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const matchedPrefix = Object.keys(ROLE_ROUTE_PREFIXES).find((p) => path.startsWith(p));

  if (!matchedPrefix) return NextResponse.next();

  const role = (req.auth?.user as any)?.role;
  const allowed = ROLE_ROUTE_PREFIXES[matchedPrefix];

  if (!role || !allowed.includes(role)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/scan/:path*", "/dispatch/:path*", "/responder/:path*", "/admin/:path*", "/register/:path*"],
};