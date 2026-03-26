import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import https from "https";

/**
 * @swagger
 * /api/scan/{id}/sync:
 *   post:
 *     summary: Synchronize scan status with GitLab
 *     description: Manually triggers a status sync for a specific scan by querying the GitLab Pipeline API.
 *     tags:
 *       - Scanning
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Scan ID or GitLab Pipeline ID
 *     responses:
 *       200:
 *         description: Status synchronized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 newStatus:
 *                   type: string
 *       404:
 *         description: Scan not found or no pipelineId
 *       500:
 *         description: Internal server error
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolved = await params;
    const scanId = resolved.id;

    console.log(`Force Sync requested for Scan: ${scanId}`);

    // 1. หาข้อมูล Scan - support both id and pipelineId
    const scan = await prisma.scanHistory.findFirst({
      where: {
        OR: [
          { id: scanId },
          { pipelineId: scanId },
        ],
      },
    });

    if (!scan || !scan.pipelineId) {
      return NextResponse.json(
        { error: "Scan not found or no pipelineId" },
        { status: 404 },
      );
    }

  
    const gitlabBaseUrl = process.env.GITLAB_API_URL;
    const projectId = process.env.GITLAB_PROJECT_ID;
    const token = process.env.GITLAB_TOKEN;
    const agent = new https.Agent({ rejectUnauthorized: false });

    const targetUrl = `${gitlabBaseUrl}/api/v4/projects/${projectId}/pipelines/${scan.pipelineId}`;
    console.log(` [Debug] Requesting URL: ${targetUrl}`);
    console.log(
      ` [Debug] Using Token: ${token ? "YES (Has Token)" : "NO (Missing Token)"}`,
    );

    const gitlabRes = await axios.get(targetUrl, {
      headers: { "PRIVATE-TOKEN": token },
      httpsAgent: agent,
    });

    const gitlabStatus = gitlabRes.data.status.toUpperCase();
    console.log(` GitLab Status: ${gitlabStatus}`);

    // 4. แปลง Status
    let newStatus = scan.status;

    if (["SUCCESS", "PASSED", "MANUAL"].includes(gitlabStatus)) {
      newStatus = "SUCCESS";
    } else if (["FAILED", "CANCELED", "SKIPPED"].includes(gitlabStatus)) {
      newStatus = "FAILED";
    } else if (gitlabStatus === "RUNNING" || gitlabStatus === "PENDING") {
      newStatus = "RUNNING";
    }

    // 5. อัปเดต DB ถ้าสถานะเปลี่ยน
    if (newStatus !== scan.status) {
      await prisma.scanHistory.update({
        where: { id: scan.id },
        data: { status: newStatus },
      });
      console.log(` DB Updated: ${newStatus}`);
    } else {
      console.log(`Running... Status unchanged.`);
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    console.error(" Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
