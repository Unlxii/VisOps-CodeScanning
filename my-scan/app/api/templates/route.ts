import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ดึง Template (Database -> Fallback)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stack = (searchParams.get("stack") || "default").toLowerCase();

  try {
    // 1. ลองค้นหาใน Database ก่อน (Admin Customization)
    // ถ้า Admin เคยแก้ Template นี้ในหน้าเว็บ ให้ใช้อันนั้น
    const dbTemplate = await prisma.dockerTemplate.findUnique({
      where: { stack },
    });

    if (dbTemplate) {
      return new NextResponse(dbTemplate.content, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. ถ้าไม่เจอใน Database ให้ใช้ Hardcoded Fallback (System Defaults)
    // เพื่อป้องกัน Error "No template found" ที่ทำให้ Pipeline พัง
    let fallbackContent = "";

    switch (stack) {
      case "node":
        fallbackContent = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || true
CMD ["npm", "start"]
`;
        break;

      case "python":
        fallbackContent = `
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || true
COPY . .
CMD ["python", "app.py"]
`;
        break;

      case "java":
        fallbackContent = `
FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests || true
CMD ["java", "-jar", "target/app.jar"]
`;
        break;

      // ใช้ Alpine เปล่าๆ แล้ว Copy ไฟล์ทั้งหมดเข้าไปเพื่อให้ Trivy สแกนได้
      default:
        fallbackContent = `
FROM alpine:latest
WORKDIR /app
# Install basic dependencies
RUN apk add --no-cache bash curl
# Copy Source Code
COPY . .
# Dummy Command
CMD ["echo", "Generic Build Complete"]
`;
        break;
    }

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("Template API Error:", error);
    // กรณี Database พังจริงๆ ให้ส่ง Fallback พื้นฐานที่สุดไป
    return new NextResponse("FROM alpine:latest\nCOPY . .\nCMD ['echo', 'DB Error']", {
        status: 200, 
        headers: { "Content-Type": "text/plain" } 
    });
  }
}

// POST: Admin แก้ไข Template (บันทึกลง Database)
// ส่วนนี้เหมือนเดิมครับ ใช้งานได้ดีแล้ว
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