// lib/trpc/client.ts
// tRPC client for use in Client Components
// Usage: import { trpc } from "@/lib/trpc/client"

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/lib/trpc/root";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
});
