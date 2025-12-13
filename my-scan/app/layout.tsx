// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = { title: "VisScan", description: "Code scanning UI" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header />
          <main className="mt-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
          VS
        </div>
        <div>
          <div className="text-lg font-semibold">VisScan</div>
          <div className="text-xs text-slate-500">
            Secure scanning for VisOps
          </div>
        </div>
      </div>
      <nav className="flex items-center gap-4 text-sm text-slate-600">
        <a href="/" className="hover:text-slate-900">
          Home
        </a>
        <a href="/scan/scanonly" className="hover:text-slate-900">
          Scan
        </a>
        <a
          href="#"
          className="px-3 py-1 rounded border border-slate-200 hover:shadow-sm"
        >
          Docs
        </a>
      </nav>
    </header>
  );
}
