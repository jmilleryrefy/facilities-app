import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import { getServerSession } from "next-auth/next";
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

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    AzureADProvider({
      id: "microsoft-entra-id",
      name: "Microsoft Entra ID",
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!,
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
    async jwt({ token, user }) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Fetch user details from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        token.role = dbUser?.role || Role.USER;
        token.department = dbUser?.department;
        token.jobTitle = dbUser?.jobTitle;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.department = token.department as string | undefined;
        session.user.jobTitle = token.jobTitle as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export default handler;

// Export getServerSession with authOptions for App Router
export const auth = () => getServerSession(authOptions);
