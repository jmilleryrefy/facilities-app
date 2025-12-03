"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";

interface NavigationProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  };
  onSignOut: () => void;
}

export default function Navigation({ user, onSignOut }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "bg-primary-dark" : "";
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/my-requests" className="font-bold text-xl">
              Facility Requests
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/my-requests"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors ${isActive(
                  "/my-requests"
                )}`}
              >
                My Requests
              </Link>
              <Link
                href="/new-request"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors ${isActive(
                  "/new-request"
                )}`}
              >
                New Request
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors ${isActive(
                    "/admin"
                  )}`}
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs opacity-90">{user.email}</div>
            </div>
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <button
              onClick={onSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium bg-primary-dark hover:bg-primary-dark/80 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
