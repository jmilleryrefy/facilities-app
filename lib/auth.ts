import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

// Allowed email domains
const ALLOWED_DOMAINS = ["yrefy.com", "investyrefy.com", "invessio.com"];

// Admin usernames (before @domain)
const ADMIN_USERNAMES = ["lehrick", "jmiller", "crees", "kwilson"];

interface MicrosoftProfile {
  department?: string;
  jobTitle?: string;
}

function isAllowedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

function isAdmin(email: string): boolean {
  const username = email.split("@")[0]?.toLowerCase();
  return ADMIN_USERNAMES.includes(username);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile, account }) {
      // Validate email domain
      if (!user.email || !isAllowedDomain(user.email)) {
        return false;
      }

      // After adapter creates the user, update with Microsoft profile info
      // Only update if this is a new sign-in (account and profile exist)
      if (account && profile && user.email) {
        const msProfile = profile as MicrosoftProfile;
        
        // Use updateMany to avoid conflicts - it won't fail if user doesn't exist yet
        await prisma.user.updateMany({
          where: { email: user.email },
          data: {
            name: user.name || undefined,
            image: user.image || undefined,
            department: msProfile.department,
            jobTitle: msProfile.jobTitle,
            role: isAdmin(user.email) ? Role.ADMIN : Role.USER,
          },
        });
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        // Fetch fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
        });

        session.user.id = user.id;
        session.user.role = dbUser?.role || Role.USER;
        session.user.department = dbUser?.department;
        session.user.jobTitle = dbUser?.jobTitle;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
});
