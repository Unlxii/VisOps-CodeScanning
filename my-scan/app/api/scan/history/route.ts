// app/api/scan/history/route.ts
/**
 * Scan History API - Get user's scan history
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const where: any = {
      service: {
        group: {
          userId: userId,
        },
      },
    };

    if (serviceId) {
      where.serviceId = serviceId;
    }

    // Fetch scans
    const scans = await prisma.scanHistory.findMany({
      where,
      include: {
        service: {
          select: {
            serviceName: true,
            imageName: true,
            group: {
              select: {
                groupName: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      scans,
      total: scans.length,
    });

  } catch (error: any) {
    console.error("[Scan History Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
