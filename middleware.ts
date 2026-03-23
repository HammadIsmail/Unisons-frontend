import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/pending"];

const ALUMNI_ONLY = ["/my-network", "/batch-mates", "/post-opportunity", "/my-opportunities"];
const STUDENT_ONLY = ["/mentors"];
const ADMIN_ONLY = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Read auth from cookie
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
      // Invalid cookie
    }
  }

  // Not authenticated → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Pending or rejected → redirect to pending
  if (accountStatus === "pending" || accountStatus === "rejected") {
    if (pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    return NextResponse.next();
  }

  // Role-based protection
  if (ADMIN_ONLY.some((r) => pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (ALUMNI_ONLY.some((r) => pathname.startsWith(r)) && role !== "alumni") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (STUDENT_ONLY.some((r) => pathname.startsWith(r)) && role !== "student") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin trying to access user dashboard → redirect to admin
  if (role === "admin" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};