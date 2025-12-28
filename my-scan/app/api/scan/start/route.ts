import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  console.log("[API] Scan Process Started (Stable Mode)");

  try {
    // 1. Config
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const groupId = "2"; 
    const token = process.env.GITLAB_TOKEN;
    const mockUser = "student_debug";

    // 2. Validate & Receive Data
    let body;
    try { body = await req.json(); } catch (e) { throw new Error("Invalid JSON Body"); }
    
    const { 
        repoUrl, 
        dockerUser, dockerToken,            
        dockerUsername, dockerAccessToken,  
        projectName, imageTag,
        // --- รับค่า Git Credential (Optional) ---
        gitUser, gitToken 
    } = body;

    const finalUser = dockerUser || dockerUsername;
    const finalToken = dockerToken || dockerAccessToken;
    const finalProjectName = projectName || "scanned-project";
    const finalUserTag = imageTag || "latest";

    console.log("DEBUG RECEIVE:", { 
        repoUrl, 
        hasDockerUser: !!finalUser, 
        hasGitUser: !!gitUser // Log ดูว่าส่ง Git User มาไหม
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
        commit_message: "Add CI Config [skip ci]" 
    }, {
        headers: { 'PRIVATE-TOKEN': token },
        httpsAgent: agent
    });
    console.log("CI File Pushed! (Waiting for sync...)");
    
    await delay(1500);

    // 7. Prepare Variables
    console.log(`Triggering Pipeline on ${targetBranch}...`);
    
    const pipelineVariables = [
        { key: 'SCAN_MODE', value: 'security' },
        { key: 'USER_REPO_URL', value: repoUrlTrimmed },
        { key: 'PROJECT_NAME', value: finalProjectName },
        { key: 'USER_TAG', value: finalUserTag }
    ];

    // --- Inject Docker Creds (ถ้ามี) ---
    if (finalUser && finalToken) {
        pipelineVariables.push(
            { key: 'DOCKER_USER', value: finalUser.trim() },
            { key: 'DOCKER_PASSWORD', value: finalToken.trim() }
        );
    }

    // --- Inject Git Creds (เฉพาะ Private Repo) ---
    if (gitUser && gitToken) {
        console.log("Injecting Git Credentials for Private Repo...");
        pipelineVariables.push(
            { key: 'GIT_USERNAME', value: gitUser.trim() },
            { key: 'GIT_TOKEN', value: gitToken.trim() }
        );
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
    console.error("❌ API ERROR OCCURRED");
    let errorDetail = err.message;

    if (axios.isAxiosError(err) && err.response) {
        console.error("GitLab Response Status:", err.response.status);
        errorDetail = JSON.stringify(err.response.data);
    } else {
        console.error(err);
    }

    return NextResponse.json({ error: "Server Error", message: err.message, detail: errorDetail }, { status: 500 });
  }
}