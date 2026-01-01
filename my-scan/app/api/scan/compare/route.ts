// app/api/scan/compare/route.ts
/**
 * Scan Comparison API - Compare two scans
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { scanId1, scanId2 } = body;

    if (!scanId1 || !scanId2) {
      return NextResponse.json(
        { error: "Missing scanId1 or scanId2" },
        { status: 400 }
      );
    }

    // Fetch both scans
    const scan1 = await prisma.scanHistory.findUnique({
      where: { id: scanId1 },
      include: {
        service: {
          include: {
            group: true,
          },
        },
      },
    });

    const scan2 = await prisma.scanHistory.findUnique({
      where: { id: scanId2 },
      include: {
        service: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!scan1 || !scan2) {
      return NextResponse.json({ error: "One or both scans not found" }, { status: 404 });
    }

    // Verify ownership
    if (
      scan1.service.group.userId !== userId ||
      scan2.service.group.userId !== userId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Extract findings from both scans
    const findings1 = ((scan1.details as any)?.findings || []) as any[];
    const findings2 = ((scan2.details as any)?.findings || []) as any[];

    // Create unique keys for comparison
    const createKey = (f: any) =>
      `${f.file || ""}:${f.line || 0}:${f.ruleId || f.type || ""}`;

    const map1 = new Map(findings1.map((f) => [createKey(f), f]));
    const map2 = new Map(findings2.map((f) => [createKey(f), f]));

    // Calculate differences
    const newFindings: any[] = [];
    const resolvedFindings: any[] = [];
    const persistentFindings: any[] = [];

    // New findings (in scan2 but not in scan1)
    map2.forEach((finding, key) => {
      if (!map1.has(key)) {
        newFindings.push(finding);
      } else {
        persistentFindings.push(finding);
      }
    });

    // Resolved findings (in scan1 but not in scan2)
    map1.forEach((finding, key) => {
      if (!map2.has(key)) {
        resolvedFindings.push(finding);
      }
    });

    return NextResponse.json({
      success: true,
      scan1: {
        id: scan1.id,
        imageTag: scan1.imageTag,
        status: scan1.status,
        startedAt: scan1.startedAt,
        vulnCritical: scan1.vulnCritical,
        vulnHigh: scan1.vulnHigh,
        vulnMedium: scan1.vulnMedium,
        vulnLow: scan1.vulnLow,
      },
      scan2: {
        id: scan2.id,
        imageTag: scan2.imageTag,
        status: scan2.status,
        startedAt: scan2.startedAt,
        vulnCritical: scan2.vulnCritical,
        vulnHigh: scan2.vulnHigh,
        vulnMedium: scan2.vulnMedium,
        vulnLow: scan2.vulnLow,
      },
      newFindings,
      resolvedFindings,
      persistentFindings,
      summary: {
        newCount: newFindings.length,
        resolvedCount: resolvedFindings.length,
        persistentCount: persistentFindings.length,
        improvementPercentage:
          findings1.length > 0
            ? ((resolvedFindings.length / findings1.length) * 100).toFixed(1)
            : "0",
      },
    });
  } catch (error: any) {
    console.error("[Compare Scans Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}