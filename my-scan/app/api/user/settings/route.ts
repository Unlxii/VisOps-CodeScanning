// /app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      defaultGitUser: true,
      defaultGitToken: true, // เช็คว่ามีค่าไหม
      defaultDockerUser: true,
      defaultDockerToken: true,
    }
  });

  return NextResponse.json({
    gitUser: user?.defaultGitUser || "",
    dockerUser: user?.defaultDockerUser || "",
    // ส่งแค่ flag ว่ามี token ไหม (ไม่ส่ง text จริงเพื่อความปลอดภัย)
    hasGitToken: !!user?.defaultGitToken,
    hasDockerToken: !!user?.defaultDockerToken,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { gitUser, gitToken, dockerUser, dockerToken } = body;

    const updateData: any = {};

    // Update เฉพาะค่าที่ส่งมา
    if (gitUser !== undefined) updateData.defaultGitUser = gitUser;
    if (gitToken) updateData.defaultGitToken = encrypt(gitToken); // Encrypt ก่อนเก็บ

    if (dockerUser !== undefined) updateData.defaultDockerUser = dockerUser;
    if (dockerToken) updateData.defaultDockerToken = encrypt(dockerToken); // Encrypt ก่อนเก็บ

    // Verify user exists before updating
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}