import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const createKey = (f: any) => `${f.pkgName}:${f.installedVersion}:${f.id}`;
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
  };
}

function normalizeSeverity(sev: string): string {
  if (!sev) return "low";
  const s = sev.toLowerCase();
  if (s === "error" || s === "critical") return "critical";
  if (s === "warning" || s === "high") return "high";
  if (s === "note" || s === "info" || s === "low") return "low";
  return s;
}

function extractAllFindings(scan: any): any[] {
  let findings: any[] = [];
  const details = (scan.details as any) || {};

  // 1. SARIF (Trivy Standard)
  if (scan.reportJson && (scan.reportJson as any).runs) {
    (scan.reportJson as any).runs.forEach((run: any) => {
      if (run.results) {
        findings = findings.concat(
          run.results.map((r: any) => ({
            id: r.ruleId || "UNKNOWN_RULE",
            sourceTool: "Trivy",
            pkgName: r.locations?.[0]?.physicalLocation?.artifactLocation?.uri || "Unknown",
            installedVersion: String(r.locations?.[0]?.physicalLocation?.region?.startLine || "0"),
            title: r.ruleId || "Vulnerability",
            severity: normalizeSeverity(r.level),
            description: r.message?.text || "No description",
          }))
        );
      }
    });
  }

  // 2. Gitleaks (Secrets) - Handle both array formats and object payloads
  const gitleaksInput = details.gitleaksReport || (scan.reportJson && scan.reportJson.gitleaks);
  if (gitleaksInput && Array.isArray(gitleaksInput)) {
    findings = findings.concat(
      gitleaksInput.map((s: any) => ({
        id: s.RuleID || "SECRET-LEAK",
        sourceTool: "Gitleaks",
        pkgName: s.File || "Unknown",
        installedVersion: String(s.StartLine || "0"),
        title: s.RuleID || "Hardcoded Secret",
        severity: "critical", // Gitleaks are always critical
        description: s.Description || `Secret match: ${s.Match}`,
        author: s.Author, // Inject committer name
        email: s.Email,   // Inject committer email
        commit: s.Commit, // Inject commit hash
      }))
    );
  }

  // 3. Semgrep (Code Issues)
  const semgrepInput = details.semgrepReport || (scan.reportJson && scan.reportJson.semgrep);
  if (semgrepInput?.results && Array.isArray(semgrepInput.results)) {
    findings = findings.concat(
      semgrepInput.results.map((r: any) => ({
        id: r.check_id || "CODE-ISSUE",
        sourceTool: "Semgrep",
        pkgName: r.path || "Unknown",
        installedVersion: String(r.start?.line || "0"),
        title: r.check_id || "Code Vulnerability",
        severity: normalizeSeverity(r.extra?.severity),
        description: r.extra?.message || "Code vulnerability found",
      }))
    );
  }

  // 4. Legacy Fallback
  if (findings.length === 0 && details.findings) {
    findings = details.findings.map((f: any) => ({
      id: f.ruleId || f.vulnerabilityID || "UNKNOWN",
      sourceTool: f.type || "Legacy",
      pkgName: f.file || f.pkgName || "Unknown",
      installedVersion: String(f.line || "0"),
      title: f.ruleId || f.vulnerabilityID || "UNKNOWN",
      severity: normalizeSeverity(f.severity),
      description: f.message || f.description || f.title || "",
    }));
  }

  return findings;
}
