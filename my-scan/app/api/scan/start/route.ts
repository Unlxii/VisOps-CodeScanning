import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function validateGitRepo(url: string, user?: string, token?: string): Promise<{ valid: boolean; error?: string }> {
    try {
        let checkUrl = url;
        
        if (user && token) {
            const cleanUrl = url.replace(/^https?:\/\//, "");
            checkUrl = `https://${user}:${token}@${cleanUrl}`;
        }

        console.log(`[Validation] Testing connection to: ${url}`);

        await execAsync(`git ls-remote --heads "${checkUrl}"`, { 
            timeout: 10000,
            env: { 
                ...process.env, 
                GIT_TERMINAL_PROMPT: '0'
            } 
        });

        return { valid: true };
    } catch (error: any) {
        console.error("Git Validation Error:", error.message);
        const msg = error.message.toLowerCase();
        if (msg.includes("not found") || msg.includes("repository not found")) {
            return { valid: false, error: "Repository not found." };
        }
        if (msg.includes("authentication failed") || msg.includes("could not read username")) {
            return { valid: false, error: "Authentication failed. Check credentials." };
        }
        if (msg.includes("timed out")) {
            return { valid: false, error: "Connection timed out." };
        }
        return { valid: false, error: "Repository unreachable or invalid." };
    }
}

export async function POST(req: Request) {
  console.log("\n--- [API] Start Scan Request Received ---");

  try {
    const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
    const groupId = process.env.GITLAB_GROUP_ID || "2"; 
    const token = process.env.GITLAB_TOKEN;

    let body;
    try { body = await req.json(); } catch (e) { throw new Error("Invalid JSON Body"); }
    
    const { 
        userName, repoUrl, 
        contextPath, customDockerfile,
        dockerUser, dockerToken, dockerUsername, dockerAccessToken,  
        projectName, imageTag,
        gitUser, gitToken 
    } = body;

    const requestorName = userName || "Anonymous";
    
    if (!repoUrl) return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });

    const repoUrlTrimmed = repoUrl.trim();

    // STEP 1: Pre-validate Repository
    const validation = await validateGitRepo(repoUrlTrimmed, gitUser, gitToken);
    
    if (!validation.valid) {
        console.warn(`[Validation] FAILED: ${validation.error}`);
        console.warn(`[Validation] STOPPING PROCESS. Project will NOT be created.`);
        
        return NextResponse.json({ 
            error: "Repository Validation Failed", 
            message: validation.error 
        }, { status: 400 });
    }
    
    console.log("[Validation] Passed. Proceeding to create project...");

    const agent = new https.Agent({ rejectUnauthorized: false });

    // 2. Read CI File
    let ciContent = "";
    try {
        const ciPath = path.join(process.cwd(), '.gitlab-ci.yml'); 
        ciContent = fs.readFileSync(ciPath, 'utf-8');
    } catch (readErr: any) {
        return NextResponse.json({ error: "Config Error", message: "Cannot read .gitlab-ci.yml" }, { status: 500 });
    }

    // 3. Create Project in GitLab
    const uniqueProjectName = `scan-${Date.now()}`;
    console.log(`[GitLab] Creating project: ${uniqueProjectName}`);
    
    const createRes = await axios.post(`${baseUrl}/api/v4/projects`, {
        name: uniqueProjectName,
        namespace_id: groupId,
        visibility: 'private',
        description: `Requested by: ${requestorName} | Repo: ${repoUrlTrimmed}`,
        initialize_with_readme: true 
    }, { headers: { 'PRIVATE-TOKEN': token }, httpsAgent: agent });

    const projectId = createRes.data.id;
    console.log(`[GitLab] Project Created ID: ${projectId}`);
    
    await delay(1500);

    // 4. Push Files
    const projectInfo = await axios.get(`${baseUrl}/api/v4/projects/${projectId}`, {
        headers: { 'PRIVATE-TOKEN': token }, httpsAgent: agent
    });
    const targetBranch = projectInfo.data.default_branch || 'main';

    await axios.post(`${baseUrl}/api/v4/projects/${projectId}/repository/files/.gitlab-ci.yml`, {
        branch: targetBranch,
        content: ciContent, 
        commit_message: "Add CI Config [skip ci]" 
    }, { headers: { 'PRIVATE-TOKEN': token }, httpsAgent: agent });

    if (customDockerfile && customDockerfile.trim().length > 0) {
        console.log(`[GitLab] Pushing custom Dockerfile...`);
        await axios.post(`${baseUrl}/api/v4/projects/${projectId}/repository/files/Dockerfile.manual`, {
            branch: targetBranch,
            content: customDockerfile, 
            commit_message: "Add Custom Dockerfile [skip ci]" 
        }, { headers: { 'PRIVATE-TOKEN': token }, httpsAgent: agent });
    }
    
    await delay(1000);

    // 5. Trigger Pipeline
    const finalUser = dockerUser || dockerUsername;
    const finalToken = dockerToken || dockerAccessToken;
    const finalProjectName = projectName || "scanned-project";
    const finalUserTag = imageTag || "latest";

    const pipelineVariables = [
        { key: 'SCAN_MODE', value: 'security' },
        { key: 'USER_REPO_URL', value: repoUrlTrimmed },
        { key: 'PROJECT_NAME', value: finalProjectName },
        { key: 'USER_TAG', value: finalUserTag },
        { key: 'REQUESTOR', value: requestorName },
        { key: 'BUILD_CONTEXT', value: contextPath || "." } 
    ];

    if (finalUser && finalToken) {
        pipelineVariables.push(
            { key: 'DOCKER_USER', value: finalUser.trim() },
            { key: 'DOCKER_PASSWORD', value: finalToken.trim() }
        );
    }
    if (gitUser && gitToken) {
        pipelineVariables.push(
            { key: 'GIT_USERNAME', value: gitUser.trim() },
            { key: 'GIT_TOKEN', value: gitToken.trim() }
        );
    }

    console.log(`[GitLab] Triggering Pipeline...`);
    const pipelineRes = await axios.post(`${baseUrl}/api/v4/projects/${projectId}/pipeline`, {
        ref: targetBranch,
        variables: pipelineVariables 
    }, { headers: { 'PRIVATE-TOKEN': token }, httpsAgent: agent });

    // 6. Save to Database
    await prisma.scanHistory.create({
      data: {
        userName: requestorName,
        repoUrl: repoUrlTrimmed,
        projectName: finalProjectName,
        imageTag: finalUserTag,
        status: "PENDING",
        scanId: projectId.toString(),
        pipelineId: pipelineRes.data.id.toString(),
        details: {
            contextPath: contextPath || ".",
            hasCustomDockerfile: !!customDockerfile
        }
      }
    });

    console.log(`[Success] Pipeline ID: ${pipelineRes.data.id}`);
    
    return NextResponse.json({
      status: "success",
      scanId: projectId.toString(),
      pipelineId: pipelineRes.data.id
    });

  } catch (err: any) {
    console.error("API CRITICAL ERROR:", err.message);
    const detail = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : err.message;
    return NextResponse.json({ error: "Server Error", message: err.message, detail }, { status: 500 });
  }
}