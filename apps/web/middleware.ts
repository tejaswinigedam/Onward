import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk auth middleware. When Clerk env isn't configured (local dev before keys),
 * it no-ops so the app still runs and builds.
 *
 * When configured, browsing is open (PRD §4): the landing, auth pages, and the
 * decoder tools (/offer, /salary) are public — anonymous visitors can interact
 * with the tools; analysis is credit-gated in the API, not the page. Only
 * account-scoped pages (/account, /admin) require sign-in. API routes enforce
 * their own auth (401 JSON), so a fetch never gets an HTML redirect for data.
 */
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Pages that require sign-in. Everything else is browsable anonymously.
const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/admin(.*)",
]);

const protect = clerkMiddleware(async (auth, req) => {
  // Open pages and API routes (which self-enforce auth) pass through.
  if (!isProtectedRoute(req) || req.nextUrl.pathname.startsWith("/api")) return;

  const { userId } = await auth();
  if (!userId) {
    const signUpUrl = new URL("/sign-up", req.url);
    signUpUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signUpUrl);
  }
});

export default clerkEnabled
  ? protect
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  matcher: [
    // Skip static assets; run on app routes and API.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
