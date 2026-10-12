import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";

export function authIsConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET
  );
}

/**
 * Google OAuth identities are keyed by their immutable Google subject, NEVER
 * by a client-supplied ID or mutable display name. Only verified emails enter
 * the users table. The DB role is the authorization source of truth.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: { signIn: "/sign-in" },
  callbacks: {
    async signIn({ account, profile }) {
      if (!authIsConfigured() || account?.provider !== "google") return false;
      const googleProfile = profile as { sub?: string; email?: string; name?: string; email_verified?: boolean } | undefined;
      if (!googleProfile?.email_verified || !googleProfile.sub || !googleProfile.email) return false;
      const db = getDatabase();
      if (!db) return false;
      try {
        const id = "google:" + googleProfile.sub;
        await db.insert(users).values({
          id,
          email: googleProfile.email.toLowerCase(),
          displayName: googleProfile.name?.slice(0, 150) ?? null,
        }).onConflictDoUpdate({
          target: users.id,
          set: { displayName: googleProfile.name?.slice(0, 150) ?? null, updatedAt: new Date() },
        });
        // A second Google account with the same verified email is not silently
        // linked to an existing user; the unique email constraint blocks it.
        const [saved] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
        return saved?.email === googleProfile.email.toLowerCase();
      } catch {
        console.error("HomeTayo Google sign-in database synchronization failed");
        return false;
      }
    },
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.homeTayoUserId = "google:" + account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.homeTayoUserId === "string") {
        session.user.id = token.homeTayoUserId;
      }
      return session;
    },
  },
});
