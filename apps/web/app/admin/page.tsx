import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/credits";
import { AdminPayments } from "./AdminPayments";

export const metadata = { title: "Admin · Payments — Onward" };
export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Access-restricted admin portal for payment verification (PRD §9). */
export default async function AdminPage() {
  let userId: string | null = null;
  if (clerkEnabled) {
    try {
      ({ userId } = await auth());
    } catch {
      userId = null;
    }
  }

  if (clerkEnabled && !isAdmin(userId)) {
    return (
      <main className="admin-wrap">
        <h1 className="admin-title">Admin</h1>
        <p className="um-s">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  return <AdminPayments />;
}
