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
      return NextResponse.json(
        { error: "One or both scans not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (
      scan1.service.group.userId !== userId ||
      scan2.service.group.userId !== userId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Extract findings from both scans
    const details1: any = scan1.details || {};
    const details2: any = scan2.details || {};
    const findings1 = (details1.findings || []) as any[];
    const findings2 = (details2.findings || []) as any[];

    console.log("[Compare] Scan1 details keys:", Object.keys(details1));
    console.log("[Compare] Scan2 details keys:", Object.keys(details2));

    console.log("[Compare] Scan1 details:", {
      hasGitleaks: !!details1.gitleaksReport,
      hasSemgrep: !!details1.semgrepReport,
      findingsCount: findings1.length,
      secretsFound: details1.secretsFound,
      codeIssuesFound: details1.codeIssuesFound,
    });

    console.log("[Compare] Scan2 details:", {
      hasGitleaks: !!details2.gitleaksReport,
      hasSemgrep: !!details2.semgrepReport,
      findingsCount: findings2.length,
      secretsFound: details2.secretsFound,
      codeIssuesFound: details2.codeIssuesFound,
    });

    // Compare Gitleaks results (secrets)
    const gitleaksComparison = compareGitleaksResults(
      details1.gitleaksReport,
      details2.gitleaksReport
    );

    // Compare Semgrep results (code issues)
    const semgrepComparison = compareSemgrepResults(
      details1.semgrepReport,
      details2.semgrepReport
    );

    // Create unique keys for comparison (legacy findings)
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
        scanMode: scan1.scanMode,
        startedAt: scan1.startedAt,
        vulnCritical: scan1.vulnCritical,
        vulnHigh: scan1.vulnHigh,
        vulnMedium: scan1.vulnMedium,
        vulnLow: scan1.vulnLow,
        secretsFound: details1.secretsFound || 0,
        codeIssuesFound: details1.codeIssuesFound || 0,
      },
      scan2: {
        id: scan2.id,
        imageTag: scan2.imageTag,
        status: scan2.status,
        scanMode: scan2.scanMode,
        startedAt: scan2.startedAt,
        vulnCritical: scan2.vulnCritical,
        vulnHigh: scan2.vulnHigh,
        vulnMedium: scan2.vulnMedium,
        vulnLow: scan2.vulnLow,
        secretsFound: details2.secretsFound || 0,
        codeIssuesFound: details2.codeIssuesFound || 0,
      },
      newFindings,
      resolvedFindings,
      persistentFindings,
      gitleaksComparison: {
        ...gitleaksComparison,
        available: !!(details1.gitleaksReport || details2.gitleaksReport),
        scan1HasReport: !!details1.gitleaksReport,
        scan2HasReport: !!details2.gitleaksReport,
      },
      semgrepComparison: {
        ...semgrepComparison,
        available: !!(details1.semgrepReport || details2.semgrepReport),
        scan1HasReport: !!details1.semgrepReport,
        scan2HasReport: !!details2.semgrepReport,
      },
      summary: {
        newCount: newFindings.length,
        resolvedCount: resolvedFindings.length,
        persistentCount: persistentFindings.length,
        improvementPercentage:
          findings1.length > 0
            ? ((resolvedFindings.length / findings1.length) * 100).toFixed(1)
            : "0",
        secrets: {
          added: gitleaksComparison.added.length,
          removed: gitleaksComparison.removed.length,
          persisting: gitleaksComparison.persisting.length,
        },
        codeIssues: {
          added: semgrepComparison.added.length,
          removed: semgrepComparison.removed.length,
          persisting: semgrepComparison.persisting.length,
        },
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

/**
 * Compare Gitleaks results between two scans
 */
function compareGitleaksResults(report1: any, report2: any) {
  // Handle missing reports
  if (!report1 && !report2) {
    return {
      added: [],
      removed: [],
      persisting: [],
      message: "No Gitleaks reports available for comparison",
    };
  }

  const secrets1 = Array.isArray(report1) ? report1 : [];
  const secrets2 = Array.isArray(report2) ? report2 : [];

  // Create unique keys for secrets
  const createSecretKey = (s: any) =>
    `${s.File || ""}:${s.StartLine || 0}:${s.RuleID || ""}:${s.Match || ""}`;

  const map1 = new Map(secrets1.map((s) => [createSecretKey(s), s]));
  const map2 = new Map(secrets2.map((s) => [createSecretKey(s), s]));

  const added: any[] = [];
  const removed: any[] = [];
  const persisting: any[] = [];

  // Added secrets (in report2 but not in report1)
  map2.forEach((secret, key) => {
    if (!map1.has(key)) {
      added.push(secret);
    } else {
      persisting.push(secret);
    }
  });

  // Removed secrets (in report1 but not in report2)
  map1.forEach((secret, key) => {
    if (!map2.has(key)) {
      removed.push(secret);
    }
  });

  return { added, removed, persisting };
}

/**
 * Compare Semgrep results between two scans
 */
function compareSemgrepResults(report1: any, report2: any) {
  // Handle missing reports
  if (!report1 && !report2) {
    return {
      added: [],
      removed: [],
      persisting: [],
      message: "No Semgrep reports available for comparison",
    };
  }

  const issues1 = Array.isArray(report1?.results) ? report1.results : [];
  const issues2 = Array.isArray(report2?.results) ? report2.results : [];

  // Create unique keys for code issues
  const createIssueKey = (i: any) =>
    `${i.path || ""}:${i.start?.line || 0}:${i.check_id || ""}`;

  const map1 = new Map(issues1.map((i) => [createIssueKey(i), i]));
  const map2 = new Map(issues2.map((i) => [createIssueKey(i), i]));

  const added: any[] = [];
  const removed: any[] = [];
  const persisting: any[] = [];

  // Added issues (in report2 but not in report1)
  map2.forEach((issue, key) => {
    if (!map1.has(key)) {
      added.push(issue);
    } else {
      persisting.push(issue);
    }
  });

  // Removed issues (in report1 but not in report2)
  map1.forEach((issue, key) => {
    if (!map2.has(key)) {
      removed.push(issue);
    }
  });

  return { added, removed, persisting };
}
