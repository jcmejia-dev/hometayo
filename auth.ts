import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { authenticateEmailPassword, emailPasswordSignInConfigured, googleSignInConfigured } from "@/lib/email-auth";

export function authIsConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET &&
    (googleSignInConfigured() || emailPasswordSignInConfigured()));
}
/** Both account types use the same DB role checks, never a role from the browser. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Explicit false previously overrode Auth.js automatic Vercel trust and broke production.
  trustHost: process.env.NODE_ENV === "development" || Boolean(process.env.VERCEL) ||
    process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  providers: [
    Google({ clientId:process.env.AUTH_GOOGLE_ID,clientSecret:process.env.AUTH_GOOGLE_SECRET }),
    Credentials({
      name:"Email and password",
      credentials:{ email:{label:"Email",type:"email"},password:{label:"Password",type:"password"} },
      async authorize(credentials) {
        return authenticateEmailPassword(credentials?.email,credentials?.password);
      },
    }),
  ],
  pages:{signIn:"/sign-in"},
  callbacks:{
    async signIn({account,profile}) {
      if (account?.provider === "credentials") return emailPasswordSignInConfigured();
      if (!googleSignInConfigured() || account?.provider !== "google") return false;
      const googleProfile=profile as {sub?:string;email?:string;name?:string;email_verified?:boolean}|undefined;
      if (!googleProfile?.email_verified || !googleProfile.sub || !googleProfile.email) return false;
      const db=getDatabase();
      if (!db) return false;
      try {
        const id="google:"+googleProfile.sub;
        await db.insert(users).values({
          id,email:googleProfile.email.toLowerCase(),
          displayName:googleProfile.name?.slice(0,150) ?? null,
        }).onConflictDoUpdate({
          target:users.id,
          set:{displayName:googleProfile.name?.slice(0,150) ?? null,updatedAt:new Date()},
        });
        const [saved]=await db.select({email:users.email}).from(users).where(eq(users.id,id)).limit(1);
        return saved?.email === googleProfile.email.toLowerCase();
      } catch {
        console.error("HomeTayo Google sign-in database synchronization failed");
        return false;
      }
    },
    jwt({token,account,user}) {
      if (account?.provider==="google" && account.providerAccountId)
        token.homeTayoUserId="google:"+account.providerAccountId;
      if (account?.provider==="credentials" && typeof user?.id==="string" && user.id.startsWith("email:"))
        token.homeTayoUserId=user.id;
      return token;
    },
    session({session,token}) {
      if (session.user && typeof token.homeTayoUserId==="string")
        session.user.id=token.homeTayoUserId;
      return session;
    },
  },
});
