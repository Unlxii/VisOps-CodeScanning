// app/api/scan/stream/active/route.ts
// Server-Sent Events (SSE) endpoint for real-time active scan status.
// Usage: const es = new EventSource("/api/scan/stream/active");
//        es.onmessage = (e) => { const data = JSON.parse(e.data); }

import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 3000; // push new data every 3 seconds
const KEEP_ALIVE_MS = 25000;   // send comment to keep connection alive

function buildActiveScansQuery(userId: string) {
  return prisma.scanHistory.findMany({
    where: {
      service: { group: { userId } },
      status: { in: ["QUEUED", "RUNNING"] },
    },
    select: {
      id: true,
      pipelineId: true,
      status: true,
      startedAt: true,
      service: {
        select: {
          serviceName: true,
          imageName: true,
          averageDuration: true,
        },
      },
    },
    orderBy: { startedAt: "asc" },
  });
}

export async function GET(req: Request) {
  const token = await getToken({
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = token.id as string;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      // Close cleanly when client disconnects
      req.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch {}
      });

      // Helper to push an SSE event
      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      // Helper to send a keep-alive comment (prevents proxy timeout)
      function keepAlive() {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          closed = true;
        }
      }

      // Poll DB and push scan data
      async function poll() {
        if (closed) return;
        try {
          const activeScans = await buildActiveScansQuery(userId);
          send({
            activeScans,
            hasActiveScans: activeScans.length > 0,
            timestamp: Date.now(),
          });

          // If no more active scans, signal client so it can close
          if (activeScans.length === 0) {
            send({ done: true });
          }
        } catch (err) {
          console.error("[SSE Poll Error]", err);
        }
      }

      // Initial push immediately
      await poll();

      // Poll on interval
      const pollId = setInterval(poll, POLL_INTERVAL_MS);

      // Keep-alive on separate interval
      const kaId = setInterval(keepAlive, KEEP_ALIVE_MS);

      // Cleanup when stream closes
      req.signal.addEventListener("abort", () => {
        clearInterval(pollId);
        clearInterval(kaId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
