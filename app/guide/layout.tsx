// app/guide/layout.tsx — Public guide layout (no auth required)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";

const navItems = [
  { label: "Getting Started", href: "/guide", exact: true },
  { label: "Scanners", href: "/guide/scanners" },
  { label: "Scan & Build", href: "/guide/scan-build" },
  { label: "Scan Only", href: "/guide/scan-only" },
  { label: "Architecture", href: "/guide/architecture" },
];

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Top bar — matching LandingNavbar style */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Logo — same as LandingNavbar */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                VS
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                VisScan
              </span>
            </Link>

            {/* Separator + Section label */}
            <span className="text-slate-300 dark:text-slate-700 text-lg font-light">/</span>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              <BookOpen size={15} className="text-blue-500" />
              Guide
            </div>
          </div>

          {/* Right side nav links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-sm hover:shadow-md"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] border-r border-slate-100 dark:border-slate-800 py-6 px-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">
            Documentation
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                  isActive(item.href, item.exact)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                >
                <ChevronRight size={12} className={isActive(item.href, item.exact) ? "text-blue-500" : "text-slate-300 dark:text-slate-600"} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Ready to scan?</p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mb-2">Login to start your first security scan</p>
              <Link
                href="/dashboard"
                className="block text-center text-xs font-semibold py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 xl:px-16 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
