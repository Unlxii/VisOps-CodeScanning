import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        createdAt: true,
        startedAt: true, // [NEW]
        completedAt: true, // [NEW]
        scanLogs: true, // [NEW]
        pipelineJobs: true, // [NEW] Pipeline Jobs for Stepper
        scanMode: true,
        imagePushed: true, // ✅ Add this field
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

    // --- Data Processing ---
    const details = (scan.details as any) || {};
    const findings = details.findings || [];
    const logs = details.logs || [];

    // คำนวณ Counts สดๆ จาก Findings (เพื่อให้ตรงกับตารางเป๊ะๆ)
    const counts = {
      critical: findings.filter((f: any) => f.severity === "critical").length,
      high: findings.filter((f: any) => f.severity === "high").length,
      medium: findings.filter((f: any) => f.severity === "medium").length,
      low: findings.filter((f: any) => f.severity === "low").length,
    };

    // คำนวณ Progress Bar แบบคร่าวๆ
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

    // 🔥 FORCE DELETE: สั่งลบจากตาราง ScanHistory โดยตรง
    // ไม่ต้องเช็ค ProjectGroup (เพราะนี่คือการลบ Scan ตัวเดียว)
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
