// components/Navbar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show navbar on login, setup, or home page (for unauthenticated users)
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/setup" ||
    (pathname === "/" && status === "unauthenticated");

  if (hideNavbar) {
    return null;
  }

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return null;
  }

  const isSetupComplete = (session.user as any)?.isSetupComplete;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={isSetupComplete ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              VS
            </div>
            <span className="text-lg font-semibold text-gray-900">VisScan</span>
          </Link>

          {/* Navigation Links */}
          {isSetupComplete && (
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard"
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/scan/history"
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith("/scan/history")
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  History
                </Link>
                <Link
                  href="/settings"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/settings"
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Settings
                </Link>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-6 border-l">
                <div className="text-sm">
                  <div className="font-medium text-gray-700">
                    {session.user?.name?.split(" ")[0] || "User"}
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Setup incomplete - show minimal nav */}
          {!isSetupComplete && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">{session.user?.email}</div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
