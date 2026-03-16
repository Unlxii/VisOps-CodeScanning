import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const QuotaUpdateSchema = z.object({
  userId: z.string(),
  maxProjects: z.number().int().min(1).max(100),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, maxProjects } = QuotaUpdateSchema.parse(body);

    // Check target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { maxProjects },
      select: { id: true, maxProjects: true }
    });

    console.log(`[Admin] Quota updated: User ${targetUser.email} → maxProjects=${maxProjects} (by ${session.user.email})`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid Data", details: error.issues }, { status: 400 });
    }
    console.error("[API_ADMIN_QUOTA_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
