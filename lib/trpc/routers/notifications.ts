// lib/trpc/routers/notifications.ts
// First tRPC router: pending user approvals (replaces /api/admin/pending-users)

import { createTRPCRouter, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

export const notificationsRouter = createTRPCRouter({
  // GET /trpc/notifications.pendingCount
  pendingCount: adminProcedure.query(async () => {
    const count = await prisma.user.count({
      where: { status: "PENDING" },
    });
    return { count };
  }),

  // GET /trpc/notifications.pendingUsers
  pendingUsers: adminProcedure.query(async () => {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { users };
  }),
});
