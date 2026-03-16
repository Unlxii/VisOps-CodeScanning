// lib/trpc/routers/users.ts
import { createTRPCRouter, adminProcedure } from "@/lib/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
  // GET all users for admin dashboard
  all: adminProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        maxProjects: true,
        accounts: {
          select: {
            provider: true,
          },
          take: 1,
        },
        _count: {
          select: {
            groups: true, // It's groups in schema
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // We need to fetch scan/service counts per user since they are nested deeply
    // Group projects by user -> services -> scans
    const allProjects = await prisma.projectGroup.findMany({
      select: {
        userId: true,
        _count: {
          select: {
            services: true,
          },
        },
        services: {
          select: {
            _count: {
              select: {
                scans: true,
              },
            },
          },
        },
      },
    });

    const userStatsMap = new Map<string, { services: number; scans: number }>();
    for (const project of allProjects) {
      if (!userStatsMap.has(project.userId)) {
        userStatsMap.set(project.userId, { services: 0, scans: 0 });
      }
      const stats = userStatsMap.get(project.userId)!;
      stats.services += project._count.services;
      for (const service of project.services) {
        stats.scans += service._count.scans;
      }
    }

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      maxProjects: user.maxProjects,
      provider: user.accounts[0]?.provider || "credentials",
      stats: {
        projects: user._count.groups,
        services: userStatsMap.get(user.id)?.services || 0,
        scans: userStatsMap.get(user.id)?.scans || 0,
      },
    }));
  }),
});
