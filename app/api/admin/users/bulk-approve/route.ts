// app/api/admin/users/bulk-approve/route.ts
// Approve multiple pending users in one request

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const BulkApproveSchema = z.union([
  z.object({ approveAll: z.literal(true) }),
  z.object({
    approveAll: z.literal(false).optional(),
    userIds: z.array(z.string()).min(1, "At least one user ID required"),
  }),
]);

/**
 * @swagger
 * /api/admin/users/bulk-approve:
 *   post:
 *     summary: Approve multiple pending users at once (Admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approveAll:
 *                 type: boolean
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users approved
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
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
    const parsed = BulkApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const approveAll = "approveAll" in parsed.data && parsed.data.approveAll === true;
    const userIds = "userIds" in parsed.data ? parsed.data.userIds : [];

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
