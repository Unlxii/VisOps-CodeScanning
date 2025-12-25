// /app/api/scan/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import https from "https";

// ฟังก์ชันแปลง Email ต้องเหมือนกับไฟล์อื่น
function sanitizeEmail(email) {
    return email.toLowerCase().replace(/[@.]/g, "_");
}

export async function DELETE(req, { params }) {
    try {
        const resolved = await params;
        const projectId = resolved.id;

        // 1. ตรวจสอบ User (Mock Fallback)
        const cookieStore = cookies();
        const userEmail = (await cookieStore).get("visops_user_email")?.value || "developer@visops.com";
        const userId = sanitizeEmail(userEmail);

        const agent = new https.Agent({ rejectUnauthorized: false });
        const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
        const token = process.env.GITLAB_TOKEN;

        console.log(`🗑️ Delete Request from ${userEmail} for Project ID: ${projectId}`);

        // 2. ตรวจสอบความเป็นเจ้าของ (Security Check)
        const projectUrl = `${baseUrl}/api/v4/projects/${projectId}`;
        
        // ดึงข้อมูล Project มาดู Topic
        let projectData;
        try {
            const checkRes = await axios.get(projectUrl, {
                headers: { 'PRIVATE-TOKEN': token },
                httpsAgent: agent
            });
            projectData = checkRes.data;
        } catch (e) {
             if (e.response?.status === 404) {
                 return NextResponse.json({ error: "Project not found" }, { status: 404 });
             }
             return NextResponse.json({ error: "GitLab Error" }, { status: 500 });
        }

        const projectTopics = projectData.topics || [];
        
        // ถ้า Topic ไม่ตรงกับ User ห้ามลบ
        if (!projectTopics.includes(userId)) {
            console.warn(`⛔ Unauthorized delete attempt by ${userEmail}`);
            return NextResponse.json({ error: "Unauthorized: You do not own this project" }, { status: 403 });
        }

        // 3. สั่งลบจริง
        await axios.delete(projectUrl, {
            headers: { 'PRIVATE-TOKEN': token },
            httpsAgent: agent
        });

        console.log(`✅ Project ${projectId} deleted successfully`);
        return NextResponse.json({ success: true, message: "Deleted successfully" });

    } catch (err) {
        console.error("Delete Error:", err.message);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}