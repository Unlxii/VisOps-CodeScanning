import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const history = await prisma.scanHistory.findMany({
      orderBy: { createdAt: "desc" }, // เรียงจากล่าสุดไปเก่าสุด
      take: 50 // ดึงแค่ 50 รายการล่าสุด
    });
    
    // แปลงวันที่เป็น String เพื่อความชัวร์เวลาส่ง JSON
    const formattedHistory = history.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error("History Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}