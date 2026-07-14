import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getServiceClient } from "@/lib/supabase";

const inr = (n: number) => "₹ " + Math.round(n).toLocaleString("en-IN");
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function AccountPage() {
  if (!clerkEnabled) {
    return (
      <>
        <Nav />
        <main>
          <section className="page-hero" style={{ minHeight: "60vh" }}>
            <div className="page-hero-inner">
              <h1 className="page-h1" style={{ fontSize: 30 }}>Accounts aren&apos;t configured yet</h1>
              <p className="page-lead">Add your Clerk keys to <code>.env.local</code> to enable sign-in and saved history.</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  // Data lives in Supabase; ownership is enforced here via the Clerk user id.
  const supabase = getServiceClient();
  const { data: items } = supabase
    ? await supabase
        .from("computations")
        .select("id, kind, results, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as Array<{ id: string; kind: string; results: unknown; created_at: string }> };

  return (
    <>
      <Nav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="page-kicker">Your account</div>
            <h1 className="page-h1" style={{ fontSize: 34 }}>
              {user?.primaryEmailAddress?.emailAddress ?? "Welcome"}
            </h1>
            <p className="page-lead">Your saved calculations live here.</p>
          </div>
        </section>
        <section className="sec">
          <div className="wrap">
            {!items?.length ? (
              <p className="opp-none">
                Nothing saved yet. Try the{" "}
                <Link href="/salary" style={{ color: "var(--indigo)", fontWeight: 700 }}>Salary Demystifier</Link>.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 12, maxWidth: 720, margin: "0 auto" }}>
                {items.map((it) => {
                  const r = (it.results ?? {}) as { netMonthly?: number };
                  return (
                    <div key={it.id} className="offer-card">
                      <div className="offer-card-head">
                        <span style={{ textTransform: "capitalize" }}>{it.kind}</span>
                        <span className="offer-badge big">
                          {new Date(it.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      {it.kind === "salary" && r.netMonthly != null && (
                        <div className="offer-out-row"><span>Take-home / mo</span><b>{inr(r.netMonthly)}</b></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
