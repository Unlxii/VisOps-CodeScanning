// lib/trpc/server.ts
// tRPC server-side initialization
// Usage: import { createTRPCContext } from "@/lib/trpc/server"

import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import { ZodError } from "zod";

// Context — passed to every procedure
export interface TRPCContext {
  session: Session | null;
}

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await getServerSession(authOptions);
  return { session };
}

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Surface Zod validation errors clearly
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected: requires login
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

// Admin only: requires ADMIN or SUPERADMIN role
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const role = ctx.session?.user?.role;
  if (!role || !["ADMIN", "SUPERADMIN"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, session: ctx.session! } });
});
