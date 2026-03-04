// app/api/admin/notifications/pending-users/route.ts
// Returns list of PENDING users for admin notification bell

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    const result = pendingUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      provider:
        u.accounts?.length > 0 ? u.accounts[0].provider : "credentials",
    }));

    return NextResponse.json({ pendingUsers: result, count: result.length });
  } catch (error) {
    console.error("[Admin Notifications API]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
