import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/scan/compare:
 *   post:
 *     summary: Compare findings between two scans
 *     tags: [Scanning]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scanId1, scanId2]
 *             properties:
 *               scanId1:
 *                 type: string
 *               scanId2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comparison result with new, resolved, and persistent findings
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Scans not found
 *       500:
 *         description: Server error
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    const { scanId1, scanId2 } = body;

    // Fetch scans
    const scan1 = await prisma.scanHistory.findUnique({
      where: { id: scanId1 },
      include: { service: { include: { group: true } } },
    });
    const scan2 = await prisma.scanHistory.findUnique({
      where: { id: scanId2 },
      include: { service: { include: { group: true } } },
    });

    if (!scan1 || !scan2)
      return NextResponse.json({ error: "Scans not found" }, { status: 404 });

    const findings1 = extractAllFindings(scan1);
    const findings2 = extractAllFindings(scan2);

    // Key uses the same fields as the frontend Finding interface
    const createKey = (f: any) => `${f.file}:${f.line}:${f.ruleId}`;
    const map1 = new Map(findings1.map((f) => [createKey(f), f]));
    const map2 = new Map(findings2.map((f) => [createKey(f), f]));

    const newFindings: any[] = [];
    const resolvedFindings: any[] = [];
    const persistentFindings: any[] = [];

    // หาของใหม่ (มีใน 2 แต่ไม่มีใน 1)
    map2.forEach((f, k) => {
      if (!map1.has(k)) newFindings.push(f);
      else persistentFindings.push(f);
    });

    // หาของที่แก้แล้ว (มีใน 1 แต่หายไปจาก 2)
    map1.forEach((f, k) => {
      if (!map2.has(k)) resolvedFindings.push(f);
    });

    return NextResponse.json({
      success: true,
      scan1: formatScanSummary(scan1),
      scan2: formatScanSummary(scan2),
      newFindings,
      resolvedFindings,
      persistentFindings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- HELPERS ---
function formatScanSummary(scan: any) {
  return {
    id: scan.id,
    imageTag: scan.imageTag,
    status: scan.status,
    startedAt: scan.startedAt,
    vulnCritical: scan.vulnCritical,
    vulnHigh: scan.vulnHigh,
    vulnMedium: scan.vulnMedium,
    vulnLow: scan.vulnLow,
  };
}

function normalizeSeverity(sev: string): string {
  if (!sev) return "LOW";
  const s = sev.toUpperCase();
  if (s === "ERROR" || s === "CRITICAL") return "CRITICAL";
  if (s === "WARNING" || s === "HIGH") return "HIGH";
  if (s === "MEDIUM") return "MEDIUM";
  if (s === "NOTE" || s === "INFO" || s === "LOW") return "LOW";
  return s;
}

/**
 * Extract findings in the format the frontend expects:
 * { file, line, ruleId, severity, message, sourceTool }
 */
function extractAllFindings(scan: any): any[] {
  let findings: any[] = [];
  const details = (scan.details as any) || {};

  // 1. SARIF (Trivy Standard)
  if (scan.reportJson && (scan.reportJson as any).runs) {
    (scan.reportJson as any).runs.forEach((run: any) => {
      if (run.results) {
        findings = findings.concat(
          run.results.map((r: any) => ({
            file: r.locations?.[0]?.physicalLocation?.artifactLocation?.uri || "Unknown",
            line: r.locations?.[0]?.physicalLocation?.region?.startLine || 0,
            ruleId: r.ruleId || "UNKNOWN_RULE",
            severity: normalizeSeverity(r.level),
            message: r.message?.text || "No description",
            sourceTool: "Trivy",
          }))
        );
      }
    });
  }

  // 2. Gitleaks (Secrets)
  const gitleaksInput = details.gitleaksReport || (scan.reportJson && scan.reportJson.gitleaks);
  if (gitleaksInput && Array.isArray(gitleaksInput)) {
    findings = findings.concat(
      gitleaksInput.map((s: any) => ({
        file: s.File || "Unknown",
        line: s.StartLine || 0,
        ruleId: s.RuleID || "SECRET-LEAK",
        severity: "CRITICAL",
        message: s.Description || `Secret match: ${s.Match}`,
        sourceTool: "Gitleaks",
      }))
    );
  }

  // 3. Semgrep (Code Issues)
  const semgrepInput = details.semgrepReport || (scan.reportJson && scan.reportJson.semgrep);
  if (semgrepInput?.results && Array.isArray(semgrepInput.results)) {
    findings = findings.concat(
      semgrepInput.results.map((r: any) => ({
        file: r.path || "Unknown",
        line: r.start?.line || 0,
        ruleId: r.check_id || "CODE-ISSUE",
        severity: normalizeSeverity(r.extra?.severity),
        message: r.extra?.message || "Code vulnerability found",
        sourceTool: "Semgrep",
      }))
    );
  }

  // 4. Legacy Fallback
  if (findings.length === 0 && details.findings) {
    findings = details.findings.map((f: any) => ({
      file: f.file || f.pkgName || "Unknown",
      line: f.line || 0,
      ruleId: f.ruleId || f.vulnerabilityID || "UNKNOWN",
      severity: normalizeSeverity(f.severity),
      message: f.message || f.description || f.title || "",
      sourceTool: f.type || "Legacy",
    }));
  }

  return findings;
}
