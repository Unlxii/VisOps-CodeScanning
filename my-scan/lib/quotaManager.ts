// lib/quotaManager.ts
import { prisma } from './prisma';
import { getPipelineStatus } from './gitlab';

const DEFAULT_MAX_PROJECTS = 6; // Fallback if user has no maxProjects set

/**
 * Checks if user has reached their project quota
 * Counts ProjectService (not ProjectGroup) — each service = 1 quota unit
 * Uses per-user maxProjects from DB (admin-editable)
 */
export async function checkUserQuota(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxAllowed: number;
  error?: string;
}> {
  try {
    // Fetch user's personal quota limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { maxProjects: true }
    });
    const maxAllowed = user?.maxProjects ?? DEFAULT_MAX_PROJECTS;

    // Count active services (across all active groups)
    const activeServiceCount = await prisma.projectService.count({
      where: {
        group: {
          userId: userId,
          isActive: true
        }
      }
    });

    const canCreate = activeServiceCount < maxAllowed;

    return {
      canCreate,
      currentCount: activeServiceCount,
      maxAllowed,
      error: canCreate ? undefined : `Quota exceeded: You have ${activeServiceCount}/${maxAllowed} active services. Please delete a service before creating a new one.`
    };
  } catch (error: any) {
    return {
      canCreate: false,
      currentCount: 0,
      maxAllowed: DEFAULT_MAX_PROJECTS,
      error: `Failed to check quota: ${error.message}`
    };
  }
}

/**
 * Checks if user can submit a new scan for a specific project
 * Prevents concurrent scans for the same project
 */
export async function checkScanQuota(serviceId: string): Promise<{
  canScan: boolean;
  error?: string;
}> {
  try {
    // Check if there's already a scan in progress for this service
    const activeScan = await prisma.scanHistory.findFirst({
      where: {
        serviceId: serviceId,
        status: {
          in: ['QUEUED', 'RUNNING'] // Check both states
        }
      }
    });

    if (activeScan) {
      // ✅ 1. ถ้าสถานะเป็น QUEUED -> ยังไงก็ต้องรอ (Worker ยังไม่หยิบ)
      if (activeScan.status === 'QUEUED') {
        return {
          canScan: false,
          error: 'A scan is already is in the queue. Please wait.'
        };
      }

      // ✅ 2. ถ้าสถานะเป็น RUNNING -> เช็คกับ GitLab จริงๆ ว่ายังวิ่งอยู่ไหม?
      // (กันเหนียวกรณี Worker ตาย หรือ Network หลุด ทำให้สถานะค้าง)
      if (activeScan.status === 'RUNNING' && activeScan.pipelineId) {
        try {
            const realStatus = await getPipelineStatus(activeScan.pipelineId);
            
            // Case A: ไม่เจอ Pipeline นี้ใน GitLab (แสดงว่าเจ๊ง หรือเป็น data ขยะ)
            if (!realStatus) {
                console.warn(`[Quota] Ghost job detected! ID: ${activeScan.id} (Pipeline ${activeScan.pipelineId}) not found in GitLab.`);
                // Auto-fix DB
                await prisma.scanHistory.update({
                    where: { id: activeScan.id },
                    data: { status: 'FAILED_TRIGGER', completedAt: new Date(), errorMessage: "Ghost job detected and auto-closed" }
                });
                 return { canScan: true }; // ปล่อยผ่าน
            }

            // Case B: เจอ แต่สถานะจบไปแล้ว (success, failed, canceled)
            const finishedStates = ['success', 'failed', 'canceled', 'skipped'];
            if (finishedStates.includes(realStatus.status)) {
                 console.warn(`[Quota] Job ${activeScan.id} marked RUNNING but is actually ${realStatus.status}. Auto-fixing.`);
                 const newStatus = realStatus.status === 'success' ? 'SUCCESS' : 'FAILED';
                 await prisma.scanHistory.update({
                    where: { id: activeScan.id },
                    data: { status: newStatus, completedAt: new Date() }
                });
                return { canScan: true }; // ปล่อยผ่าน
            }

            // Case C: ยังวิ่งอยู่จริงๆ (running, pending, created)
            return {
                canScan: false,
                error: `Scan is currently running on GitLab (Pipeline #${realStatus.id}). Please wait.`
            };

        } catch (err) {
            console.error("[Quota] Failed to verify GitLab status:", err);
            // กรณีเช็คไม่ได้ (GitLab ล่ม) ให้เชื่อ DB ไปก่อน (เพื่อความปลอดภัย)
             return {
                canScan: false,
                error: 'Scan is in progress (Verification failed). Please wait.'
            };
        }
      }

      // Fallback for cases without pipelineId but Marked RUNNING (Rare)
      return {
        canScan: false,
        error: 'A scan is already in progress. Please wait.'
      };
    }

    return { canScan: true };
  } catch (error: any) {
    return {
      canScan: false,
      error: `Failed to check scan status: ${error.message}`
    };
  }
}

/**
 * Archives/deactivates a project (soft delete)
 * Frees up quota for user
 */
export async function archiveProject(projectId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Verify ownership
    const project = await prisma.projectGroup.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      return {
        success: false,
        error: 'Project not found or you do not have permission to delete it'
      };
    }

    // Soft delete
    await prisma.projectGroup.update({
      where: { id: projectId },
      data: { isActive: false }
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to archive project: ${error.message}`
    };
  }
}
