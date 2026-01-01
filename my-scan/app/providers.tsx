// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main>{children}</main>
    </SessionProvider>
  );
}
