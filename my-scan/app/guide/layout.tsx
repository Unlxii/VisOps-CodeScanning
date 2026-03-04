// app/guide/layout.tsx — Public guide layout (no auth required)
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";

const navItems = [
  { label: "Getting Started", href: "/guide", exact: true },
  { label: "Scanners", href: "/guide/scanners" },
  { label: "Scan & Build", href: "/guide/scan-build" },
  { label: "Scan Only", href: "/guide/scan-only" },
  { label: "Architecture", href: "/guide/architecture" },
];

export const metadata = {
  title: "Guide — VisScan",
  description: "Learn how to use VisScan Secure Pipeline",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                VS
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-sm">VisScan</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
              <BookOpen size={14} className="text-blue-500" />
              Guide
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors"
          >
            Open App →
          </Link>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-slate-100 dark:border-slate-800 py-6 px-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">
            Documentation
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
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
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
