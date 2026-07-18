import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { RefCapture } from "@/components/RefCapture";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  // Referral rewards are only for new sign-ups — an already-signed-in user
  // opening someone else's referral link gets a message instead of the
  // sign-up widget (Clerk would otherwise just no-op or bounce them).
  let alreadySignedIn = false;
  if (clerkEnabled && ref) {
    const { userId } = await auth();
    alreadySignedIn = Boolean(userId);
  }

  return (
    <>
      <RefCapture />
      <Nav />
      <main>
        <section className="page-hero" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!clerkEnabled ? (
            <div className="page-hero-inner" style={{ textAlign: "center" }}>
              <h1 className="page-h1" style={{ fontSize: 30 }}>Sign-up isn&apos;t configured yet</h1>
              <p className="page-lead">Add your Clerk keys to <code>.env.local</code> to enable authentication.</p>
            </div>
          ) : alreadySignedIn ? (
            <div className="page-hero-inner" style={{ textAlign: "center" }}>
              <h1 className="page-h1" style={{ fontSize: 30 }}>You&apos;re already signed in</h1>
              <p className="page-lead">Referral rewards are only for new sign-ups — this link won&apos;t do anything extra for an existing account.</p>
              <Link href="/account" className="btn-nav" style={{ display: "inline-flex", marginTop: 16 }}>Go to your account</Link>
            </div>
          ) : (
            <SignUp />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
