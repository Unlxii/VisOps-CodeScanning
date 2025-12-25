// /app/api/scan/status/[id]/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

// --- Types & Interfaces ---

type VulnerabilityFinding = {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: string;
  title?: string;
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep"; // เพิ่ม field นี้เพื่อรู้ว่ามาจากตัวไหน
};

// Helper: แปลง Severity ของ Semgrep เป็นมาตรฐานเดียวกัน
function mapSemgrepSeverity(sev: string): string {
  const s = sev.toUpperCase();
  if (s === "ERROR") return "high";
  if (s === "WARNING") return "medium";
  if (s === "INFO") return "low";
  return "medium"; // Default
}

// Helper: คำนวณเวลา
function formatDuration(seconds: number) {
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Config
  const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
  const token = process.env.GITLAB_TOKEN;
  const agent = new https.Agent({ rejectUnauthorized: false });

  if (!baseUrl || !token) {
    return NextResponse.json({ error: "Missing Config" }, { status: 500 });
  }

  try {
    // 1. Get Pipeline Info
    const pipelineRes = await axios.get(
      `${baseUrl}/api/v4/projects/${id}/pipelines`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
        params: { per_page: 1, order_by: "id", sort: "desc" },
      }
    );

    if (pipelineRes.data.length === 0) return NextResponse.json({ status: "not_found" });

    const pipeline = pipelineRes.data[0];
    const status = pipeline.status;
    
    // Calculate Duration
    let durationString = "Pending...";
    if (pipeline.created_at && pipeline.updated_at) {
        const start = new Date(pipeline.created_at).getTime();
        const end = status === 'running' || status === 'pending' ? Date.now() : new Date(pipeline.updated_at).getTime();
        durationString = formatDuration((end - start) / 1000);
    }

    // Init Response Data
    let counts = { critical: 0, high: 0, medium: 0, low: 0 };
    let findings: VulnerabilityFinding[] = [];
    let logs: string[] = [`Pipeline: ${pipeline.id}`, `Status: ${status.toUpperCase()}`];

    // 2. ถ้า Success ให้ดึง Report จากทั้ง 3 Tools
    if (status === "success") {
      logs.push("Fetching reports from Trivy, Gitleaks, Semgrep...");
      
      const jobsRes = await axios.get(
        `${baseUrl}/api/v4/projects/${id}/pipelines/${pipeline.id}/jobs`,
        { headers: { "PRIVATE-TOKEN": token }, httpsAgent: agent }
      );
      
      const jobs = jobsRes.data;

      // Define Scanners Config
      const scanners = [
        {
          name: "Trivy",
          jobName: "trivy_scan", // *ต้องตรงกับชื่อใน .gitlab-ci.yml*
          artifact: "trivy-report.json",
          parser: (report: any) => {
             // Trivy Logic
             if(!report.Results) return;
             report.Results.forEach((res: any) => {
               if(res.Vulnerabilities) {
                 res.Vulnerabilities.forEach((v: any) => {
                   const sev = v.Severity.toLowerCase();
                   findings.push({
                     id: v.VulnerabilityID,
                     pkgName: v.PkgName,
                     installedVersion: v.InstalledVersion,
                     fixedVersion: v.FixedVersion,
                     severity: sev,
                     title: v.Title || v.Description?.slice(0,50),
                     sourceTool: "Trivy"
                   });
                   incrementCount(sev);
                 });
               }
             });
          }
        },
        {
          name: "Gitleaks",
          jobName: "gitleaks_scan", // *ต้องตรงกับชื่อใน .gitlab-ci.yml*
          artifact: "gitleaks-report.json",
          parser: (report: any) => {
             // Gitleaks Logic (Report มักจะเป็น Array ของ Objects)
             // Gitleaks report is usually an array: [{RuleID:..., File:..., Secret:...}]
             const leaks = Array.isArray(report) ? report : [];
             leaks.forEach((leak: any) => {
               // Secret leaks are almost always Critical
               findings.push({
                 id: leak.RuleID || "SECRET-LEAK",
                 pkgName: leak.File || "Unknown File",
                 installedVersion: "N/A", // Secret ไม่มี version
                 fixedVersion: "Revoke Secret",
                 severity: "critical",
                 title: `Secret exposed in ${leak.File}`,
                 sourceTool: "Gitleaks"
               });
               incrementCount("critical");
             });
          }
        },
        {
          name: "Semgrep",
          jobName: "semgrep_scan", // *ต้องตรงกับชื่อใน .gitlab-ci.yml*
          artifact: "semgrep-report.json",
          parser: (report: any) => {
             // Semgrep Logic (report.results array)
             if(!report.results) return;
             report.results.forEach((res: any) => {
               const semgrepSev = res.extra?.severity || "WARNING"; // ERROR, WARNING, INFO
               const normalizedSev = mapSemgrepSeverity(semgrepSev);
               
               findings.push({
                 id: res.check_id || "SAST-ISSUE",
                 pkgName: res.path || "Source Code",
                 installedVersion: `Line ${res.start?.line}`,
                 fixedVersion: "Code Fix",
                 severity: normalizedSev,
                 title: res.extra?.message?.slice(0, 60) || "Code Issue",
                 sourceTool: "Semgrep"
               });
               incrementCount(normalizedSev);
             });
          }
        }
      ];

      // Helper to count
      const incrementCount = (sev: string) => {
         if(sev === 'critical') counts.critical++;
         else if(sev === 'high') counts.high++;
         else if(sev === 'medium') counts.medium++;
         else if(sev === 'low') counts.low++;
      };

      // 3. Process each scanner in parallel
      await Promise.all(scanners.map(async (scanner) => {
        const job = jobs.find((j: any) => j.name === scanner.jobName);
        if (!job) {
          logs.push(`⚠️ Job '${scanner.jobName}' not found.`);
          return;
        }

        try {
          const res = await axios.get(
            `${baseUrl}/api/v4/projects/${id}/jobs/${job.id}/artifacts/${scanner.artifact}`,
            { headers: { "PRIVATE-TOKEN": token }, httpsAgent: agent, responseType: "json" }
          );
          
          logs.push(`✅ Parsed ${scanner.name} report.`);
          scanner.parser(res.data);
          
        } catch (err) {
          console.error(`Error fetching ${scanner.name}:`, err);
          logs.push(`❌ Failed to fetch/parse ${scanner.name}.`);
        }
      }));
      
      logs.push(`Total findings: ${findings.length}`);
    }

    // Response
    return NextResponse.json({
      id: pipeline.id.toString(),
      repoUrl: pipeline.web_url.split('/-/')[0],
      status: status === "success" ? "done" : status,
      step: status === "success" ? "All Scans Completed" : "Scanning...",
      progress: status === "success" ? 100 : 50,
      counts,
      findings,
      logs,
      buildStatus: status,
      pipelineUrl: pipeline.web_url,
      scanDuration: durationString
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}