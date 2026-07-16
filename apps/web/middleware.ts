import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk auth middleware. When Clerk env isn't configured (local dev before keys),
 * it no-ops so the app still runs and builds.
 *
 * When configured, only the landing page and the auth pages are public. Every
 * other page requires an account — signed-out visitors are redirected to
 * sign-up (carrying the intended destination so they land there after joining).
 * API routes are left to enforce their own auth (they return 401 JSON), so a
 * fetch never gets an HTML redirect in place of data.
 */
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const protect = clerkMiddleware(async (auth, req) => {
  // Public pages and API routes (which self-enforce auth) pass through.
  if (isPublicRoute(req) || req.nextUrl.pathname.startsWith("/api")) return;

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
