// app/api/projects/[id]/route.ts
/**
 * Project Management API - Delete (soft delete) project
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const projectId = params.id;

    // Find project and verify ownership
    const project = await prisma.projectGroup.findUnique({
      where: { id: projectId },
      include: {
        services: {
          include: {
            scans: {
              where: {
                status: { in: ["QUEUED", "RUNNING"] }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if there are active scans
    const hasActiveScans = project.services.some(
      service => service.scans.length > 0
    );

    if (hasActiveScans) {
      return NextResponse.json(
        { 
          error: "Cannot delete project with active scans. Please wait for scans to complete.",
          hasActiveScans: true
        },
        { status: 400 }
      );
    }

    // Soft delete (set isActive to false)
    await prisma.projectGroup.update({
      where: { id: projectId },
      data: { isActive: false },
    });

    console.log(`[Project Deleted] User ${userId} deleted project ${projectId}`);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully (soft delete)",
    });

  } catch (error: any) {
    console.error("[Delete Project Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET single project details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const projectId = params.id;

    const project = await prisma.projectGroup.findUnique({
      where: { id: projectId },
      include: {
        services: {
          include: {
            scans: {
              orderBy: { startedAt: "desc" },
              take: 10,
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, project });

  } catch (error: any) {
    console.error("[Get Project Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
