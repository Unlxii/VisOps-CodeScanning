import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import https from "https";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch recent history
    const history = await prisma.scanHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // 2. Filter pending items
    const pendingItems = history.filter(item => item.status === "PENDING" || item.status === "running");

    if (pendingItems.length > 0) {
      console.log(`[Sync] Found ${pendingItems.length} pending items. Checking GitLab...`);

      const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
      const token = process.env.GITLAB_TOKEN;
      const agent = new https.Agent({ rejectUnauthorized: false });

      // 3. Check status from GitLab
      await Promise.all(pendingItems.map(async (item) => {
        if (!item.pipelineId || !item.scanId) return;

        try {
          const res = await axios.get(
            `${baseUrl}/api/v4/projects/${item.scanId}/pipelines/${item.pipelineId}`,
            {
              headers: { "PRIVATE-TOKEN": token },
              httpsAgent: agent
            }
          );

          const realStatus = res.data.status;
          let dbStatus = "PENDING";

          if (realStatus === "success") dbStatus = "SUCCESS";
          else if (realStatus === "failed") dbStatus = "FAILED";
          else if (realStatus === "canceled") dbStatus = "FAILED";
          else if (realStatus === "running" || realStatus === "pending") dbStatus = "PENDING";
          else dbStatus = "FAILED";

          // 4. Update if changed
          if (dbStatus !== item.status) {
            console.log(`[Sync] Updating ID ${item.id}: ${item.status} -> ${dbStatus}`);
            
            await prisma.scanHistory.update({
              where: { id: item.id },
              data: { status: dbStatus }
            });

            item.status = dbStatus;
          }

        } catch (err) {
          console.error(`[Sync] Failed to check pipeline ${item.pipelineId}:`, err);
          
          if (axios.isAxiosError(err) && err.response?.status === 404) {
             await prisma.scanHistory.update({
               where: { id: item.id },
               data: { status: "FAILED" }
             });
             item.status = "FAILED";
          }
        }
      }));
    }

    // 5. Return updated history
    return NextResponse.json(history);

  } catch (error) {
    console.error("History Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}