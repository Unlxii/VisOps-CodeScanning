import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Normalize severity Helper for inline counts computation
function normalizeSeverity(sev: string): string {
  if (!sev) return "low";
  const s = sev.toLowerCase();
  if (s === "error" || s === "critical") return "critical";
  if (s === "warning" || s === "high") return "high";
  if (s === "note" || s === "info" || s === "low") return "low";
  return s;
}

// Extraction logic identical to scan-compare.ts
function extractAllFindings(scan: any): any[] {
  let findings: any[] = [];
  const details = (scan.details as any) || {};

  // 1. SARIF (Trivy Standard)
  if (scan.reportJson && (scan.reportJson as any).trivy && (scan.reportJson as any).trivy.Results) {
    (scan.reportJson as any).trivy.Results.forEach((run: any) => {
      if (run.Vulnerabilities) {
        findings = findings.concat(
          run.Vulnerabilities.map((v: any) => ({
            id: v.VulnerabilityID || "UNKNOWN_RULE",
            sourceTool: "Trivy",
            pkgName: v.PkgName || "Unknown",
            installedVersion: v.InstalledVersion || "0",
            title: v.Title || v.VulnerabilityID || "Vulnerability",
            severity: normalizeSeverity(v.Severity),
            description: v.Description || "No description",
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
      type: "Legacy",
      file: f.file || f.pkgName || "Unknown",
      line: f.line || 0,
      ruleId: f.ruleId || f.vulnerabilityID || "UNKNOWN",
      severity: normalizeSeverity(f.severity),
      message: f.message || f.description || f.title || "",
    }));
  }

  return findings;
}

// 1. GET: ดึงข้อมูล Scan สำหรับ PipelineView
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolved = await params;
    const id = resolved.id;

    // ค้นหาข้อมูลจาก DB
    const scan = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { pipelineId: id }, // กรณีหาด้วย Pipeline ID
          { id: id }, // กรณีหาด้วย UUID
        ],
      },
      select: {
        id: true,
        pipelineId: true,
        status: true,
        vulnCritical: true, // ค่าที่บันทึกใน DB
        details: true, // JSON ก้อนใหญ่ (เก็บ findings, logs)
        reportJson: true, // Raw downloads by Worker Poller
        createdAt: true,
        startedAt: true, // [NEW]
        completedAt: true, // [NEW]
        scanLogs: true, // [NEW]
        pipelineJobs: true, // [NEW] Pipeline Jobs for Stepper
        scanMode: true,
        imagePushed: true, // Add this field
        service: {
          select: {
            group: { select: { repoUrl: true } },
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // --- Data Processing (Dynamically extract ALL nested mappings) ---
    const details = (scan.details as any) || {};
    const findings = extractAllFindings(scan);
    const logs = details.logs || [];

    // คำนวณ Counts สดๆ จาก Findings (เพื่อให้ตรงกับตารางเป๊ะๆ)
    const counts = {
      critical: findings.filter((f: any) => f.severity === "critical").length,
      high: findings.filter((f: any) => f.severity === "high").length,
      medium: findings.filter((f: any) => f.severity === "medium").length,
      low: findings.filter((f: any) => f.severity === "low").length,
    };

    let progress = 0;
    let step = "Initializing...";

    switch (scan.status) {
      case "PENDING":
        progress = 10;
        step = "Queued";
        break;
      case "RUNNING":
        progress = 50;
        step = "Scanning...";
        break;
      case "WAITING_CONFIRMATION":
        progress = 90;
        step = "Waiting for Approval";
        break;
      case "SUCCESS":
        progress = 100;
        step = "Completed";
        break;
      case "BLOCKED":
        progress = 100;
        step = "Security Blocked";
        break;
      case "FAILED":
        progress = 100;
        step = "Pipeline Failed";
        break;
    }

    // สร้าง URL ไปยัง GitLab (ปรับแก้ตาม URL จริงของคุณ)
    const gitlabBaseUrl = process.env.GITLAB_API_URL || "http://10.10.184.118";
    const projectUrl = `${gitlabBaseUrl}/admin/projects/${process.env.GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}`;

    // --- Response ---
    return NextResponse.json({
      id: scan.id,
      pipelineId: scan.pipelineId,
      repoUrl: scan.service?.group?.repoUrl || "Unknown Repo",

      // ส่ง Status เป็น Uppercase เพื่อให้ตรงกับ TypeScript ใน Frontend
      status: scan.status,
      scanMode: scan.scanMode,
      imagePushed: scan.imagePushed, // ✅ Return this field

      step: step,
      progress: progress,

      counts: counts, // ส่งตัวเลขที่นับใหม่

      findings: findings, // ในนี้จะมี author, email ของ Gitleaks ติดไปด้วยถ้ามี
      logs: logs,
      
      pipelineJobs: scan.pipelineJobs, // [NEW] Return pipeline jobs
      scanLogs: scan.scanLogs,
      scanDuration: scan.startedAt && scan.completedAt 
        ? Math.floor((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000)
        : null,

      vulnCritical: scan.vulnCritical, // ใช้สำหรับ Alert Blocked
      pipelineUrl: projectUrl,
    });
  } catch (error: any) {
    console.error("GET Scan Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. DELETE: ลบข้อมูล
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolved = await params;
    const targetId = resolved.id;

    console.log(`[Delete] Request received for Scan ID: ${targetId}`);

    const result = await prisma.scanHistory.deleteMany({
      where: {
        OR: [
          { id: targetId }, // กรณีส่งมาเป็น UUID
          { pipelineId: targetId }, // กรณีส่งมาเป็น Pipeline ID
        ],
      },
    });

    if (result.count === 0) {
      // ถ้าหาไม่เจอจริงๆ ให้ถือว่าลบไปแล้ว (เพื่อไม่ให้หน้าเว็บ Error)
      return NextResponse.json({
        success: true,
        message: "Record already deleted",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err: any) {
    console.error("[Delete] Error:", err.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// 3. PATCH: Update scan status (for admin force cancel)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can force cancel
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolved = await params;
    const targetId = resolved.id;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !["CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Only CANCELLED is allowed" },
        { status: 400 }
      );
    }

    // Update scan status
    const updated = await prisma.scanHistory.updateMany({
      where: {
        OR: [
          { id: targetId },
          { pipelineId: targetId },
        ],
      },
      data: {
        status: status,
        completedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Scan ${status.toLowerCase()} successfully`,
    });
  } catch (err: any) {
    console.error("[PATCH] Error:", err.message);
    return NextResponse.json({ error: "Failed to update scan" }, { status: 500 });
  }
}
