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
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { serviceId } = await params;

    // Get service with ownership check
    const service = await prisma.projectService.findUnique({
      where: { id: serviceId },
      include: {
        group: {
          select: { userId: true, groupName: true, repoUrl: true },
        },
      },
    });

    if (!service || service.group.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get latest 2 successful scan histories for comparison
    const scans = await prisma.scanHistory.findMany({
      where: {
        serviceId,
        status: { in: ["SUCCESS", "PASSED", "FAILED_SECURITY", "BLOCKED"] },
      },
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
        reportJson: true,
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

    // Extract vulnerability details from both legacy and new format
    const latestDetails = (latest.details as any) || {};
    const previousDetails = (previous.details as any) || {};

    // Try to get findings from reportJson (SARIF format) or fallback to details
    const latestFindings = extractFindings(latest.reportJson, latestDetails);
    const previousFindings = extractFindings(
      previous.reportJson,
      previousDetails
    );

    // Create maps for comparison using file path + rule as key
    const createKey = (finding: any) =>
      `${
        finding.file ||
        finding.location?.physicalLocation?.artifactLocation?.uri ||
        ""
      }:${finding.ruleId || finding.rule?.id || ""}`;

    const latestMap = new Map(latestFindings.map((f) => [createKey(f), f]));
    const previousMap = new Map(previousFindings.map((f) => [createKey(f), f]));

    // Find new findings (in latest but not in previous)
    const newFindings = latestFindings.filter(
      (f) => !previousMap.has(createKey(f))
    );

    // Find resolved findings (in previous but not in latest)
    const resolvedFindings = previousFindings.filter(
      (f) => !latestMap.has(createKey(f))
    );

    // Find persisting findings (in both)
    const persistingFindings = latestFindings.filter((f) =>
      previousMap.has(createKey(f))
    );

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
      contextPath: service.contextPath,
      groupName: service.group.groupName,
      repoUrl: service.group.repoUrl,
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
          new: newFindings.length,
          resolved: resolvedFindings.length,
          persisting: persistingFindings.length,
          newList: newFindings.slice(0, 20),
          resolvedList: resolvedFindings.slice(0, 20),
          persistingList: persistingFindings.slice(0, 20),
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

// Helper function to extract findings from reportJson or details
function extractFindings(reportJson: any, details: any): any[] {
  let findings: any[] = [];

  // Try SARIF format first (reportJson)
  if (reportJson && reportJson.runs) {
    reportJson.runs.forEach((run: any) => {
      if (run.results) {
        findings = findings.concat(
          run.results.map((result: any) => ({
            file:
              result.locations?.[0]?.physicalLocation?.artifactLocation?.uri ||
              "",
            line:
              result.locations?.[0]?.physicalLocation?.region?.startLine || 0,
            ruleId: result.ruleId || "",
            severity: result.level || "warning",
            message: result.message?.text || "",
          }))
        );
      }
    });
  }

  // Fallback to details object (legacy format)
  if (findings.length === 0) {
    if (details.findings && Array.isArray(details.findings)) {
      findings = details.findings;
    } else if (
      details.criticalVulnerabilities &&
      Array.isArray(details.criticalVulnerabilities)
    ) {
      findings = details.criticalVulnerabilities;
    }
  }

  return findings;
}
