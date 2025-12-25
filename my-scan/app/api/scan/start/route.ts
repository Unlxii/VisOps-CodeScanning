import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  console.log("[API] Scan Process Started (Clean Dynamic Mode)");

  try {
    // 1. Config
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const groupId = "2"; 
    const token = process.env.GITLAB_TOKEN;
    const mockUser = "student_debug";

    // 2. Validate & Receive Data
    let body;
    try { body = await req.json(); } catch (e) { throw new Error("Invalid JSON Body"); }
    
    // --- FIX START: Handle Variable Name Mismatch & New Fields ---
    const { 
        repoUrl, 
        dockerUser, dockerToken,            // ชื่อเก่า
        dockerUsername, dockerAccessToken,  // ชื่อใหม่จาก FormScan
        projectName, imageTag               // **เพิ่มรับค่าใหม่**
    } = body;

    // Consolidate into final variables (prefer the one that has a value)
    const finalUser = dockerUser || dockerUsername;
    const finalToken = dockerToken || dockerAccessToken;
    const finalProjectName = projectName || "scanned-project"; // Default กันเหนียว
    const finalUserTag = imageTag || "latest";                 // Default กันเหนียว

    console.log("DEBUG RECEIVE:", { 
        repoUrl, 
        receivedUser: !!finalUser, 
        receivedToken: !!finalToken,
        projectName: finalProjectName,
        imageTag: finalUserTag
    });

    if (!repoUrl) throw new Error("Missing repoUrl");

    const repoUrlTrimmed = repoUrl.trim();
    const agent = new https.Agent({ rejectUnauthorized: false });

    // 3. Read CI File
    let ciContent = "";
    try {
        const ciPath = path.join(process.cwd(), '.gitlab-ci.yml'); 
        ciContent = fs.readFileSync(ciPath, 'utf-8');
        if (!ciContent) throw new Error("File is empty");
        console.log("Original .gitlab-ci.yml loaded.");
    } catch (readErr: any) {
        return NextResponse.json({ error: "Config Error", message: "Cannot read .gitlab-ci.yml" }, { status: 500 });
    }

    // 4. Create Project
    const uniqueProjectName = `scan-${mockUser}-${Date.now()}`;
    const createRes = await axios.post(`${baseUrl}/api/v4/projects`, {
        name: uniqueProjectName,
        namespace_id: groupId,
        visibility: 'private',
        topics: [mockUser], 
        initialize_with_readme: true 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });

    const projectId = createRes.data.id;
    console.log(`Project Created ID: ${projectId}`);
    await delay(2000);

    // 5. Detect Branch
    const projectInfo = await axios.get(`${baseUrl}/api/v4/projects/${projectId}`, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });
    const targetBranch = projectInfo.data.default_branch || 'main';

    // 6. Push CI File
    console.log("Pushing clean .gitlab-ci.yml...");
    await axios.post(`${baseUrl}/api/v4/projects/${projectId}/repository/files/.gitlab-ci.yml`, {
        branch: targetBranch,
        content: ciContent, 
        commit_message: "Add CI Config"
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });
    console.log("CI File Pushed! (Waiting for trigger...)");

    // -------------------------------------------------------------
    // Step 7: Prepare Variables for Trigger Pipeline
    // -------------------------------------------------------------
    console.log(`Triggering Pipeline on ${targetBranch} with URL: ${repoUrlTrimmed}`);
    
    // Base variables
    const pipelineVariables = [
        { key: 'SCAN_MODE', value: 'security', variable_type: 'env_var' },
        { key: 'USER_REPO_URL', value: repoUrlTrimmed, variable_type: 'env_var' },
        
        // **เพิ่มการส่งตัวแปรใหม่ไปให้ GitLab CI**
        { key: 'PROJECT_NAME', value: finalProjectName, variable_type: 'env_var' },
        { key: 'USER_TAG', value: finalUserTag, variable_type: 'env_var' }
    ];

    // Check finalUser and finalToken
    if (finalUser && finalToken) {
        console.log("Injecting Docker Credentials into Pipeline...");
        pipelineVariables.push(
            { key: 'DOCKER_USER', value: finalUser.trim(), variable_type: 'env_var' },
            { key: 'DOCKER_PASSWORD', value: finalToken.trim(), variable_type: 'env_var' }
        );
    } else {
        console.log("No Docker Credentials provided (Build step might fail push).");
    }

    // 8. Trigger Pipeline
    const pipelineRes = await axios.post(`${baseUrl}/api/v4/projects/${projectId}/pipeline`, {
        ref: targetBranch,
        variables: pipelineVariables 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });

    console.log(`Pipeline Started ID: ${pipelineRes.data.id}`);

    return NextResponse.json({
      status: "success",
      scanId: projectId.toString(),
      pipelineId: pipelineRes.data.id
    });

  } catch (err: any) {
    console.error("API ERROR:", err.message);
    let errorDetail = "";
    if (axios.isAxiosError(err) && err.response) {
        errorDetail = JSON.stringify(err.response.data);
    }
    return NextResponse.json({ error: "Server Error", message: err.message, detail: errorDetail }, { status: 500 });
  }
}