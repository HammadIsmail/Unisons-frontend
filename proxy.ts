import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/pending"];

const ALUMNI_ONLY = ["/post-opportunity", "/my-opportunities", "/batch-mates"];
const STUDENT_ONLY = ["/mentors"];
const ADMIN_ONLY = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Manual redirect for legacy route
  if (pathname === "/my-network") {
    return NextResponse.redirect(new URL("/network", request.url));
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Read auth from cookie (Zustand persist uses cookies via our custom storage)
  const authCookie = request.cookies.get("unison_auth");
  let token: string | null = null;
  let role: string | null = null;
  let accountStatus: string | null = null;

  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie.value));
      const state = parsed?.state;
      token = state?.token ?? null;
      role = state?.role ?? null;
      accountStatus = state?.account_status ?? null;
    } catch {
      // Invalid cookie format
    }
  }

  // Not authenticated → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle Pending / Rejected users
  if (accountStatus === "pending" || accountStatus === "rejected") {
    if (pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return NextResponse.next();
  }

  // Redirect from /pending if already approved
  if (pathname === "/pending" && accountStatus === "approved") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Role-based protection redirects to /feed for unauthorized access
  if (ADMIN_ONLY.some((r) => pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (ALUMNI_ONLY.some((r) => pathname.startsWith(r)) && role !== "alumni") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (STUDENT_ONLY.some((r) => pathname.startsWith(r)) && role !== "student") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Admin trying to access user feed → redirect to admin dashboard
  if (role === "admin" && pathname === "/feed") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};