// app/api/templates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // เรียกใช้ Prisma Connection

// GET: ดึง Template จาก Database (ใช้โดย CI Pipeline และหน้า Admin)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stack = searchParams.get("stack") || "default";

  // Security Check (Optional: เช็ค Key ถ้าต้องการความปลอดภัยสูง)
  // const authHeader = req.headers.get("x-api-key");
  // if (process.env.NODE_ENV === 'production' && authHeader !== process.env.TEMPLATE_API_KEY) {
  //    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    // 1. ค้นหาใน Database
    const template = await prisma.dockerTemplate.findUnique({
      where: { stack },
    });

    // 2. ถ้าเจอ ให้ส่ง content กลับไป
    if (template) {
      return new NextResponse(template.content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 3. ถ้าไม่เจอ ให้ส่ง Default กลับไป
    return new NextResponse(`# Error: No template found for stack '${stack}'`, {
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "Internal Database Error" }, { status: 500 });
  }
}

// POST: Admin แก้ไข Template (บันทึกลง Database)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stack, content } = body;

    if (!stack || !content) {
      return NextResponse.json({ error: "Missing stack or content" }, { status: 400 });
    }

    // Upsert: ถ้ามีอยู่แล้วให้แก้ (Update) ถ้ายังไม่มีให้สร้างใหม่ (Create)
    await prisma.dockerTemplate.upsert({
      where: { stack },
      update: { content },
      create: { stack, content },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}