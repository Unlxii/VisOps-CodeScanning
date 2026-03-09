// lib/trpc/routers/scan.ts
// tRPC router for scan history — read-only queries
// Write operations (start scan, sync) remain on existing REST routes

import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const scanRouter = createTRPCRouter({
  // GET a single scan by id or pipelineId
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const scan = await prisma.scanHistory.findFirst({
        where: { OR: [{ id: input.id }, { pipelineId: input.id }] },
        select: {
          id: true,
          pipelineId: true,
          status: true,
          scanMode: true,
          imageTag: true,
          startedAt: true,
          completedAt: true,
          vulnCritical: true,
          vulnHigh: true,
          vulnMedium: true,
          vulnLow: true,
          imagePushed: true,
          description: true,
          service: {
            select: {
              serviceName: true,
              imageName: true,
              averageDuration: true,
              group: { select: { groupName: true, repoUrl: true } },
            },
          },
        },
      });
      return { scan };
    }),

  // GET scan history for the current user
  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = (ctx.session.user as any).id as string;

      const scans = await prisma.scanHistory.findMany({
        where: { service: { group: { userId } } },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          pipelineId: true,
          status: true,
          scanMode: true,
          imageTag: true,
          startedAt: true,
          completedAt: true,
          vulnCritical: true,
          vulnHigh: true,
          service: { select: { serviceName: true } },
        },
      });

      let nextCursor: string | undefined;
      if (scans.length > input.limit) {
        nextCursor = scans.pop()!.id;
      }

      return { scans, nextCursor };
    }),

  // Admin: all scans (paginated)
  allAdmin: adminProcedure
    .input(z.object({ limit: z.number().default(50), cursor: z.string().optional() }))
    .query(async ({ input }) => {
      const scans = await prisma.scanHistory.findMany({
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          pipelineId: true,
          status: true,
          scanMode: true,
          startedAt: true,
          vulnCritical: true,
          service: {
            select: {
              serviceName: true,
              group: { select: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (scans.length > input.limit) nextCursor = scans.pop()!.id;

      return { scans, nextCursor };
    }),
});
