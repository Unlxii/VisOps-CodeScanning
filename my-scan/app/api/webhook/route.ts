import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Webhook received from GitLab:", body);

    // ในอนาคต: ตรงนี้เราจะเขียนโค้ดอัปเดต Database
    // แต่ตอนนี้ให้ Log ดูก่อนว่าเชื่อมต่อได้จริง
    
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}