"use client";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { createClient, isConfigured } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const configured = isConfigured();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function google() {
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) setErr(error.message);
  }

  return (
    <>
      <Nav />
      <main>
        <section className="page-hero" style={{ minHeight: "70vh" }}>
          <div className="page-hero-inner" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            <div className="page-kicker">Sign in</div>
            <h1 className="page-h1" style={{ fontSize: 34 }}>
              Welcome to <span className="accent">Onward</span>
            </h1>
            <p className="page-lead" style={{ margin: "14px auto 26px" }}>
              One step — no password. Signing in unlocks saving your calculations and fully
              personalised opportunities.
            </p>

            {!configured ? (
              <p className="opp-none">
                Auth isn&apos;t configured yet. Add your Supabase keys to <code>.env.local</code>.
              </p>
            ) : sent ? (
              <div className="cta-success" style={{ color: "var(--green)", background: "var(--green-0)", border: "1px solid #BBF7D0" }}>
                Check your email for the magic link.
              </div>
            ) : (
              <>
                <button className="btn-hero" style={{ width: "100%", justifyContent: "center", marginBottom: 14 }} onClick={google}>
                  Continue with Google
                </button>
                <form onSubmit={magicLink} className="cta-form" style={{ background: "var(--white)", border: "1.5px solid var(--border)" }}>
                  <input
                    className="cta-input"
                    style={{ color: "var(--ink)" }}
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className="cta-btn">Email me a link</button>
                </form>
                {err && <p className="opp-none" style={{ color: "var(--coral-d)" }}>{err}</p>}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
