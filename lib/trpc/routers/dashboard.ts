// lib/trpc/routers/dashboard.ts
// tRPC router for dashboard data: projects + active scans + stats

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";

export const dashboardRouter = createTRPCRouter({
  // GET projects with services and latest scans
  projects: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as any).id as string;

    const projects = await prisma.projectGroup.findMany({
      where: { userId, isActive: true },
      include: {
        services: {
          include: {
            scans: {
              take: 5,
              orderBy: { startedAt: "desc" },
              select: {
                id: true,
                pipelineId: true,
                status: true,
                scanMode: true,
                imageTag: true,
                vulnCritical: true,
                vulnHigh: true,
                vulnMedium: true,
                vulnLow: true,
                startedAt: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { projects };
  }),

  // GET summary stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session.user as any).id as string;

    const [totalProjects, totalScans, activeScans] = await Promise.all([
      prisma.projectGroup.count({ where: { userId, isActive: true } }),
      prisma.scanHistory.count({ where: { service: { group: { userId } } } }),
      prisma.scanHistory.count({
        where: {
          service: { group: { userId } },
          status: { in: ["QUEUED", "RUNNING"] },
        },
      }),
    ]);

    return { totalProjects, totalScans, activeScans };
  }),
});
