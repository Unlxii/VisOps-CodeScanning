// app/api/admin/users/bulk-approve/route.ts
// Approve multiple pending users in one request

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    // userIds: string[] — specific users to approve
    // approveAll: boolean — approve all PENDING users
    const { userIds, approveAll } = body;

    if (approveAll) {
      // Approve ALL pending users at once
      const result = await prisma.user.updateMany({
        where: { status: "PENDING" },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({
        success: true,
        approved: result.count,
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "No user IDs provided" },
        { status: 400 }
      );
    }

    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        status: "PENDING", // Only approve pending users (safety guard)
      },
      data: { status: "ACTIVE" },
    });

    return NextResponse.json({
      success: true,
      approved: result.count,
    });
  } catch (error) {
    console.error("[Bulk Approve API]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
