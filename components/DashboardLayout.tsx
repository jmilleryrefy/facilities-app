"use client";

import { signOut } from "next-auth/react";
import Navigation from "./Navigation";
import { Role } from "@prisma/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  };
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
