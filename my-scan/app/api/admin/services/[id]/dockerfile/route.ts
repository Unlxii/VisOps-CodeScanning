import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const service = await prisma.projectService.findUnique({
      where: { id },
      select: {
        id: true,
        serviceName: true,
        useCustomDockerfile: true,
        dockerfileContent: true,
        detectedLanguage: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const token = await getToken({
        req: req as any,
        secret: process.env.NEXTAUTH_SECRET,
      });
  
      if (!token || token.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { id } = params;
      const body = await req.json();
      const { dockerfileContent } = body;

      if (typeof dockerfileContent !== "string") {
          return NextResponse.json({ error: "Content must be string" }, { status: 400 });
      }

      await prisma.projectService.update({
          where: { id },
          data: {
              dockerfileContent,
              useCustomDockerfile: true, // Force custom on manual edit
              dockerfileOverrideBy: `ADMIN:${token.email || "unknown"}`,
          }
      });

      return NextResponse.json({ success: true });
  } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
}
