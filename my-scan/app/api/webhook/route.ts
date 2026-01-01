// app/api/webhook/route.ts
/**
 * GitLab Pipeline Webhook Handler
 * - Receives status updates from GitLab CI/CD pipeline stages
 * - Merges findings from multiple security tools (GitLeaks, Semgrep, Trivy)
 * - Updates scan status and vulnerability counts
 * - Handles final success/failure determination
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface WebhookPayload {
  pipelineId: string | number;
  status: string;
  stage?: string;
  jobName?: string;
  vulnCritical?: number;
  vulnHigh?: number;
  vulnMedium?: number;
  vulnLow?: number;
  details?: {
    findings?: any[];
    logs?: string[];
    errorMessage?: string;
    [key: string]: any;
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as WebhookPayload;
    
    console.log(`[Webhook] Received: Pipeline ${body.pipelineId}, Status: ${body.status}, Stage: ${body.stage || 'N/A'}`);

    const { pipelineId, status, stage, jobName, vulnCritical, vulnHigh, vulnMedium, vulnLow, details } = body;

    // Validate required fields
    if (!pipelineId || !status) {
      return NextResponse.json({ error: "Missing pipelineId or status" }, { status: 400 });
    }

    // Find scan record by pipeline ID
    const scanRecord = await prisma.scanHistory.findFirst({
      where: { pipelineId: pipelineId.toString() }
    });

    if (!scanRecord) {
      console.error(`[Webhook] Scan record not found for pipeline ${pipelineId}`);
      return NextResponse.json({ error: "Scan record not found" }, { status: 404 });
    }

    // Merge findings and logs from multiple pipeline stages
    const currentDetails: any = scanRecord.details || { findings: [], logs: [], stages: {} };
    const newFindings = details?.findings || [];
    const newLogs = details?.logs || [];

    // Deduplicate findings based on unique identifier (file + line + rule)
    const existingFindings = currentDetails.findings || [];
    const findingMap = new Map();
    
    [...existingFindings, ...newFindings].forEach((finding: any) => {
      const key = `${finding.file || ''}:${finding.line || ''}:${finding.ruleId || finding.type || ''}`;
      if (!findingMap.has(key)) {
        findingMap.set(key, finding);
      }
    });

    const mergedFindings = Array.from(findingMap.values());
    const mergedLogs = [...(currentDetails.logs || []), ...newLogs];

    // Track stage completion
    const stages = currentDetails.stages || {};
    if (stage) {
      stages[stage] = {
        status,
        jobName,
        completedAt: new Date().toISOString(),
      };
    }

    // Calculate vulnerability counts
    let totalCritical = scanRecord.vulnCritical || 0;
    let totalHigh = scanRecord.vulnHigh || 0;
    let totalMedium = scanRecord.vulnMedium || 0;
    let totalLow = scanRecord.vulnLow || 0;

    if (vulnCritical !== undefined) totalCritical += Number(vulnCritical);
    if (vulnHigh !== undefined) totalHigh += Number(vulnHigh);
    if (vulnMedium !== undefined) totalMedium += Number(vulnMedium);
    if (vulnLow !== undefined) totalLow += Number(vulnLow);

    // Determine final status
    let finalStatus = status.toUpperCase();
    
    // Map GitLab pipeline statuses to our system
    const statusMapping: { [key: string]: string } = {
      'PENDING': 'QUEUED',
      'RUNNING': 'RUNNING',
      'SUCCESS': 'SUCCESS',
      'FAILED': 'FAILED',
      'CANCELED': 'FAILED',
      'SKIPPED': 'RUNNING', // Continue if stage skipped
    };

    finalStatus = statusMapping[finalStatus] || finalStatus;

    // Override with FAILED_SECURITY if critical vulnerabilities found
    if (totalCritical > 0 && (finalStatus === 'SUCCESS' || finalStatus === 'RUNNING')) {
      finalStatus = 'FAILED_SECURITY';
    }

    // Prepare update data
    const updateData: any = {
      status: finalStatus,
      updatedAt: new Date(),
      vulnCritical: totalCritical,
      vulnHigh: totalHigh,
      vulnMedium: totalMedium,
      vulnLow: totalLow,
      details: {
        ...currentDetails,
        findings: mergedFindings,
        logs: mergedLogs,
        stages,
        errorMessage: details?.errorMessage || currentDetails.errorMessage,
      },
    };

    // Set completion time if final status
    if (['SUCCESS', 'FAILED', 'FAILED_SECURITY'].includes(finalStatus)) {
      updateData.completedAt = new Date();
    }

    // Update scan history
    await prisma.scanHistory.update({
      where: { id: scanRecord.id },
      data: updateData,
    });

    console.log(`[Webhook] Updated scan ${scanRecord.id}: Status=${finalStatus}, Findings=${mergedFindings.length}, Critical=${totalCritical}`);

    return NextResponse.json({ 
      success: true,
      scanId: scanRecord.id,
      status: finalStatus,
      totalFindings: mergedFindings.length,
      criticalVulnerabilities: totalCritical,
    });

  } catch (err: any) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ 
      error: "Internal server error",
      message: err.message 
    }, { status: 500 });
  }
}