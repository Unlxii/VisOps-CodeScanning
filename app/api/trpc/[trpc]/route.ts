// app/api/trpc/[trpc]/route.ts
// Next.js App Router handler for tRPC — all /api/trpc/* requests are handled here

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/lib/trpc/root";
import { createTRPCContext } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) =>
            console.error(`[tRPC Error] ${path ?? "?"}: ${error.message}`)
        : undefined,
  });

export { handler as GET, handler as POST };
