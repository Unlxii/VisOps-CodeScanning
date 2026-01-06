import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    if (!projectId) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const token = process.env.GITLAB_TOKEN;
    const agent = new https.Agent({ rejectUnauthorized: false });

    console.log(`Release Request received for Project: ${projectId}`);

    // 1. หา Pipeline ล่าสุด
    const pipelineRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/pipelines`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
        params: { per_page: 1, order_by: "id", sort: "desc" },
      }
    );

    if (pipelineRes.data.length === 0) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
    }
    const pipelineId = pipelineRes.data[0].id;
    console.log(`Found Pipeline ID: ${pipelineId}`);

    // 2. หา Manual Job ที่ชื่อ "push_to_hub"
    const jobsRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/pipelines/${pipelineId}/jobs`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    const manualJob = jobsRes.data.find(
      (j: any) => j.name === "push_to_hub" && (j.status === "manual" || j.status === "created" || j.status === "skipped")
    );

    if (!manualJob) {
        return NextResponse.json({ 
            error: "No manual release job found. (Did the scan finish?)" 
        }, { status: 400 });
    }

    // 3. สั่ง Trigger Job
    console.log(`Triggering Job ID: ${manualJob.id} (${manualJob.name})...`);
    
    const playRes = await axios.post(
      `${baseUrl}/api/v4/projects/${projectId}/jobs/${manualJob.id}/play`,
      {},
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    return NextResponse.json({ 
        success: true, 
        message: "Docker Push Triggered", 
        buildStatus: playRes.data.status 
    });

  } catch (err: any) {
    console.error("API ERROR:", err.message);
    return NextResponse.json({ error: "Failed to release build" }, { status: 500 });
  }
}