import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server Supabase client bound to the request cookies (anon key + user session).
 * Use in Server Components / route handlers to read the signed-in user and to
 * make RLS-scoped queries as that user.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — safe to ignore; middleware
            // refreshes the session cookie.
          }
        },
      },
    },
  );
}

export const isConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
