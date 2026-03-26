import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

export async function GET(req: Request) {
  try {
    const host = req.headers.get("host");
    const isLocal = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") || process.env.NODE_ENV === "development";

    if (!isLocal) {
      return new Response("Not Found", { status: 404 });
    }

    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load API docs" }, { status: 500 });
  }
}
