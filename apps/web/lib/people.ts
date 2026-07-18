import { clerkClient } from "@clerk/nextjs/server";

export interface Person {
  email: string;
  name: string;
}

/**
 * Resolve Clerk user ids → email/name so admin tables show people, not ids.
 * Returns an empty map if Clerk can't be reached, so callers degrade to ids.
 */
export async function lookupPeople(ids: string[]): Promise<Record<string, Person>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return {};
  try {
    const client = await clerkClient();
    const res = await client.users.getUserList({ userId: unique, limit: 500 });
    const users = Array.isArray(res) ? res : res.data;
    const map: Record<string, Person> = {};
    for (const u of users) {
      map[u.id] = {
        email:
          u.primaryEmailAddress?.emailAddress ??
          u.emailAddresses?.[0]?.emailAddress ??
          "",
        name: [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "",
      };
    }
    return map;
  } catch (err) {
    console.warn("[people] Clerk lookup failed:", err);
    return {};
  }
}
