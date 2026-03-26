// /app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     description: Returns the current user's default Git and Docker settings.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gitUser:
 *                   type: string
 *                 dockerUser:
 *                   type: string
 *                 hasGitToken:
 *                   type: boolean
 *                 hasDockerToken:
 *                   type: boolean
 *                 isDockerOrganization:
 *                   type: boolean
 *                 dockerOrgName:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Update user settings
 *     description: Updates the current user's default Git and Docker credentials.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gitUser:
 *                 type: string
 *               gitToken:
 *                 type: string
 *               dockerUser:
 *                 type: string
 *               dockerToken:
 *                 type: string
 *               isDockerOrganization:
 *                 type: boolean
 *               dockerOrgName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings saved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update settings
 */

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      defaultGitUser: true,
      defaultGitToken: true,
      defaultDockerUser: true,
      defaultDockerToken: true,
      isDockerOrganization: true,
      dockerOrgName: true,
    },
  });

  return NextResponse.json({
    gitUser: user?.defaultGitUser || "",
    dockerUser: user?.defaultDockerUser || "",
    // Only send flags for security - don't expose actual tokens
    hasGitToken: !!user?.defaultGitToken,
    hasDockerToken: !!user?.defaultDockerToken,
    isDockerOrganization: user?.isDockerOrganization || false,
    dockerOrgName: user?.dockerOrgName || "",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      gitUser,
      gitToken,
      dockerUser,
      dockerToken,
      isDockerOrganization,
      dockerOrgName,
    } = body;

    // Build update data
    // Only update fields that are explicitly provided
    const updateData: any = {};

    // Git credentials
    if (gitUser !== undefined) {
      updateData.defaultGitUser = gitUser;
    }
    if (gitToken && gitToken.trim() !== "") {
      updateData.defaultGitToken = encrypt(gitToken.trim());
    }

    // Docker credentials
    if (dockerUser !== undefined) {
      updateData.defaultDockerUser = dockerUser;
    }
    if (dockerToken && dockerToken.trim() !== "") {
      updateData.defaultDockerToken = encrypt(dockerToken.trim());
    }

    // Docker Organization settings
    if (isDockerOrganization !== undefined) {
      updateData.isDockerOrganization = isDockerOrganization;
    }
    if (dockerOrgName !== undefined) {
      updateData.dockerOrgName = dockerOrgName || null;
    }

    // *** FIX: Use upsert instead of findUnique + update ***
    // This handles the case where the session exists but the DB record is missing.
    await prisma.user.upsert({
      where: { email: session.user.email },
      // Case 1: User exists -> Update the fields
      update: updateData,
      // Case 2: User does not exist -> Create new user with these settings
      create: {
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0], // Fallback name
        ...updateData,
      },
    });

    console.log(
      `[Settings Updated] User ${session.user.email} updated credentials (Upsert)`
    );

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      updated: Object.keys(updateData),
    });
  } catch (error: any) {
    console.error("[Settings Update Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
