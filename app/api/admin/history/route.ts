// app/api/admin/history/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/admin/history:
 *   get:
 *     summary: Get all scan history (Admin only)
 *     description: SUPERADMIN sees all scans. ADMIN sees scans by regular users only.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of scan history
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 *   delete:
 *     summary: Bulk delete scans by IDs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Number of deleted records
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  
  console.log("Admin History API: Session", JSON.stringify(session?.user || {}));

  const userRole = (session?.user as any)?.role;

  if (userRole !== "admin" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    console.log("Admin History API: Forbidden - Role is", userRole);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.log("Admin History API: Authorized. Fetching history...");

  try {
    const isSuperAdmin = userRole === "SUPERADMIN";

    const allHistory = await prisma.scanHistory.findMany({
      take: 100, // [PERFORMANCE] Bound to O(1) memory instead of O(N) total DB size
      where: isSuperAdmin ? undefined : {
        service: {
          group: {
            user: {
              role: { notIn: ["ADMIN", "SUPERADMIN"] }
            }
          }
        }
      },
      include: {
        service: {
          include: {
            group: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(allHistory);
  } catch (error) {
    console.error("Admin History Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (userRole !== "admin" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const result = await prisma.scanHistory.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
