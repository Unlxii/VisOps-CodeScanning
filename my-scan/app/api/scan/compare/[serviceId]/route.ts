// app/api/scan/compare/[serviceId]/route.ts
/**
 * Compare Scan Results API
 * - Get latest 2 scans for a service to compare
 * - Show improvement or degradation in vulnerabilities
 * - Display which vulnerabilities were fixed/added
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { serviceId } = params;

    // Get service with ownership check
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
      include: {
        group: {
          select: { userId: true, groupName: true },
        },
      },
    });

    if (!service || service.group.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get latest 2 scan histories
    const scans = await prisma.scanHistory.findMany({
      where: { serviceId },
      orderBy: { startedAt: "desc" },
      take: 2,
      select: {
        id: true,
        pipelineId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        imageTag: true,
        vulnCritical: true,
        vulnHigh: true,
        vulnMedium: true,
        vulnLow: true,
        details: true,
      },
    });

    if (scans.length === 0) {
      return NextResponse.json({
        error: "No scan history found",
        canCompare: false,
      });
    }

    if (scans.length === 1) {
      return NextResponse.json({
        message:
          "Only one scan available, comparison requires at least 2 scans",
        canCompare: false,
        latest: scans[0],
      });
    }

    const [latest, previous] = scans;

    // Extract vulnerability details
    const latestVulns = (latest.details as any)?.criticalVulnerabilities || [];
    const previousVulns =
      (previous.details as any)?.criticalVulnerabilities || [];

    // Create maps for comparison
    const latestMap = new Map(latestVulns.map((v: any) => [v.id, v]));
    const previousMap = new Map(previousVulns.map((v: any) => [v.id, v]));

    // Find fixed vulnerabilities (in previous but not in latest)
    const fixed = previousVulns.filter((v: any) => !latestMap.has(v.id));

    // Find new vulnerabilities (in latest but not in previous)
    const newVulns = latestVulns.filter((v: any) => !previousMap.has(v.id));

    // Find persisting vulnerabilities (in both)
    const persisting = latestVulns.filter((v: any) => previousMap.has(v.id));

    // Calculate changes
    const changes = {
      critical: latest.vulnCritical - previous.vulnCritical,
      high: latest.vulnHigh - previous.vulnHigh,
      medium: latest.vulnMedium - previous.vulnMedium,
      low: latest.vulnLow - previous.vulnLow,
    };

    // Determine overall trend
    const totalChange =
      changes.critical + changes.high + changes.medium + changes.low;
    let trend: "improved" | "degraded" | "same" = "same";

    if (totalChange < 0) trend = "improved";
    else if (totalChange > 0) trend = "degraded";

    return NextResponse.json({
      canCompare: true,
      serviceName: service.serviceName,
      groupName: service.group.groupName,
      comparison: {
        latest: {
          id: latest.id,
          pipelineId: latest.pipelineId,
          status: latest.status,
          scannedAt: latest.startedAt,
          imageTag: latest.imageTag,
          vulnerabilities: {
            critical: latest.vulnCritical,
            high: latest.vulnHigh,
            medium: latest.vulnMedium,
            low: latest.vulnLow,
            total:
              latest.vulnCritical +
              latest.vulnHigh +
              latest.vulnMedium +
              latest.vulnLow,
          },
        },
        previous: {
          id: previous.id,
          pipelineId: previous.pipelineId,
          status: previous.status,
          scannedAt: previous.startedAt,
          imageTag: previous.imageTag,
          vulnerabilities: {
            critical: previous.vulnCritical,
            high: previous.vulnHigh,
            medium: previous.vulnMedium,
            low: previous.vulnLow,
            total:
              previous.vulnCritical +
              previous.vulnHigh +
              previous.vulnMedium +
              previous.vulnLow,
          },
        },
        changes,
        trend,
        details: {
          fixed: fixed.length,
          new: newVulns.length,
          persisting: persisting.length,
          fixedList: fixed.slice(0, 10), // Top 10
          newList: newVulns.slice(0, 10), // Top 10
          persistingList: persisting.slice(0, 10), // Top 10
        },
      },
    });
  } catch (error: any) {
    console.error("[Scan Compare Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
