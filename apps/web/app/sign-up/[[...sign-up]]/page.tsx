import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SignUp } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="page-hero" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {clerkEnabled ? (
            <SignUp />
          ) : (
            <div className="page-hero-inner" style={{ textAlign: "center" }}>
              <h1 className="page-h1" style={{ fontSize: 30 }}>Sign-up isn&apos;t configured yet</h1>
              <p className="page-lead">Add your Clerk keys to <code>.env.local</code> to enable authentication.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
