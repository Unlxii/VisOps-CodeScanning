// lib/trpc/root.ts
// Root router — all sub-routers are registered here.
// Add new routers here incrementally without touching existing APIs.

import { createTRPCRouter } from "@/lib/trpc/server";
import { notificationsRouter } from "@/lib/trpc/routers/notifications";
import { dashboardRouter } from "@/lib/trpc/routers/dashboard";
import { scanRouter } from "@/lib/trpc/routers/scan";
import { usersRouter } from "@/lib/trpc/routers/users";

export const appRouter = createTRPCRouter({
  notifications: notificationsRouter,
  dashboard: dashboardRouter,
  scan: scanRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
