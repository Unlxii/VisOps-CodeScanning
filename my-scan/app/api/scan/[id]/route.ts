import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const gitlabProjectId = resolved.id; // ใช้ ID จาก URL เป็น GitLab Project ID

    // 1. Config
    const agent = new https.Agent({ rejectUnauthorized: false });
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const token = process.env.GITLAB_TOKEN;

    console.log(`[Delete] Request for Project ID: ${gitlabProjectId}`);

    // 2. สั่งลบออกจาก GitLab
    try {
        await axios.delete(`${baseUrl}/api/v4/projects/${gitlabProjectId}`, {
            headers: { 'PRIVATE-TOKEN': token },
            httpsAgent: agent
        });
        console.log(`[Delete] GitLab Project ${gitlabProjectId} deleted.`);
    } catch (e: any) {
        console.warn(`[Delete] GitLab Warning: ${e.response?.statusText || e.message}`);
        // ถึงลบใน GitLab ไม่สำเร็จ (เช่น ลบไปแล้ว) ก็ให้ทำงานต่อเพื่อลบใน DB
    }

    // 3. สั่งลบออกจาก Database (Prisma)
    await prisma.scanHistory.deleteMany({
        where: { scanId: gitlabProjectId.toString() }
    });
    console.log(`[Delete] Database records removed.`);

    return NextResponse.json({ success: true, message: "Deleted successfully" });

  } catch (err: any) {
    console.error("[Delete] Error:", err.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}