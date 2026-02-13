import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import axios from "axios";

// Config
const GITLAB_API_URL = process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID;

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const scan = await prisma.scanHistory.findUnique({
      where: { id },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // If running, try to cancel in GitLab
    if (
      (scan.status === "RUNNING" || scan.status === "QUEUED") &&
      scan.pipelineId
    ) {
      try {
        await axios.post(
          `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${scan.pipelineId}/cancel`,
          {},
          { headers: { "PRIVATE-TOKEN": GITLAB_TOKEN } }
        );
        console.log(`[Admin] Cancelled pipeline ${scan.pipelineId}`);
      } catch (error) {
        console.warn(
          `[Admin] Failed to cancel pipeline ${scan.pipelineId}:`,
          error
        );
        // Continue to delete even if cancel fails
      }
    }

    // Delete record
    await prisma.scanHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Delete Scan] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
