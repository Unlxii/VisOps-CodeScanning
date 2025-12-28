import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Webhook] Received payload:", body);

    const { scanId, status, vulnCritical, details } = body;

    if (!scanId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // อัปเดตสถานะใน Database โดยอ้างอิงจาก GitLab Project ID (scanId)
    const updated = await prisma.scanHistory.updateMany({
      where: { 
        scanId: scanId.toString() 
      },
      data: {
        status: status, // SUCCESS หรือ FAILED
        vulnCritical: Number(vulnCritical) || 0,
        details: details || {}, // ข้อมูลเพิ่มเติม (ถ้ามี)
        updatedAt: new Date()
      }
    });

    console.log(`[Webhook] Updated ${updated.count} record(s) for Project ${scanId}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}