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
const ADMIN_USERNAMES = ["lehrick", "jmiller", "crees", "kwilson", "jsanchez"];

interface MicrosoftProfile {
  email?: string;
  preferred_username?: string;
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
      profile(profile) {
        // Use the email from the profile to ensure we create/find the correct user
        const email =
          profile.email || profile.preferred_username || profile.mail;
        return {
          id: profile.sub,
          name: profile.name,
          email: email,
          image: profile.picture || null,
          role: isAdmin(email) ? Role.ADMIN : Role.USER,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile, account }) {
      // Get the actual email from the OAuth profile (the source of truth)
      const msProfile = profile as MicrosoftProfile;
      const profileEmail = (
        msProfile?.email ||
        msProfile?.preferred_username ||
        (profile as Record<string, unknown>)?.mail ||
        ""
      ) as string;
      const actualEmail = (profileEmail || user.email || "").toLowerCase();

      // Validate email domain
      if (!actualEmail || !isAllowedDomain(actualEmail)) {
        return false;
      }

      if (account && profile) {
        // Check if there's an existing account link that points to a different user (email mismatch)
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          include: { user: true },
        });

        if (
          existingAccount &&
          existingAccount.user.email?.toLowerCase() !==
            actualEmail.toLowerCase()
        ) {
          // The account link points to a different user than who is signing in.
          // Remove the stale account link so the adapter can properly create/link a new user.
          await prisma.account.delete({
            where: { id: existingAccount.id },
          });
        }

        // Ensure a user record exists for this email
        let dbUser = await prisma.user.findUnique({
          where: { email: actualEmail },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: actualEmail,
              name: user.name || undefined,
              image: user.image || undefined,
              role: isAdmin(actualEmail) ? Role.ADMIN : Role.USER,
              department: msProfile.department,
              jobTitle: msProfile.jobTitle,
            },
          });
        }

        // Check if the account is now linked to this user
        const currentAccountLink = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!currentAccountLink) {
          // Create the account link for this user
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | undefined,
            },
          });
        }

        // Update user profile info
        await prisma.user.updateMany({
          where: { email: actualEmail },
          data: {
            name: user.name || undefined,
            image: user.image || undefined,
            department: msProfile.department,
            jobTitle: msProfile.jobTitle,
            role: isAdmin(actualEmail) ? Role.ADMIN : Role.USER,
          },
        });
      }

      return true;
    },
    async jwt({ token, user, profile, account }) {
      // Initial sign in - add user info to token
      if (user) {
        // Get the actual email from the OAuth profile (source of truth),
        // not from the adapter's user object which may be stale
        const msProfile = profile as MicrosoftProfile | undefined;
        const profileEmail = (
          msProfile?.email ||
          msProfile?.preferred_username ||
          (profile as Record<string, unknown> | undefined)?.mail ||
          ""
        ) as string;
        const actualEmail = (
          profileEmail ||
          user.email ||
          ""
        ).toLowerCase();

        token.email = actualEmail;

        // Fetch the correct user from the database by email
        const dbUser = await prisma.user.findUnique({
          where: { email: actualEmail },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
          token.jobTitle = dbUser.jobTitle;
        } else {
          token.id = user.id;
          token.role = Role.USER;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
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
