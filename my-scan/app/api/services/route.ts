import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["admin@example.com", "dev@southth.com"];

export async function GET() {
  try {
    // ใช้ session แทน header
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || "";
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    // Query services based on role
    const whereClause = isAdmin ? {} : { group: { userId: userId } };

    const services = await prisma.projectService.findMany({
      where: whereClause,
      include: {
        group: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
        _count: {
          select: { scans: true },
        },
        scans: {
          take: 1,
          orderBy: { completedAt: "desc" },
          select: {
            id: true,
            pipelineId: true,
            status: true,
            vulnCritical: true,
            vulnHigh: true,
            vulnMedium: true,
            vulnLow: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
