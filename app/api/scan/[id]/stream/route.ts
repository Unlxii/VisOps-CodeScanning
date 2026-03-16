// app/api/scan/[id]/stream/route.ts
// SSE endpoint that pushes live status for a specific scan.
// Client: const es = new EventSource(`/api/scan/${scanId}/stream`);

import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TERMINAL_STATUSES = new Set([
  "SUCCESS", "FAILED", "FAILED_SECURITY", "CANCELLED",
]);
const POLL_INTERVAL_MS = 3000;
const KEEP_ALIVE_MS = 20000;

async function fetchScanStatus(id: string) {
  return prisma.scanHistory.findFirst({
    where: { OR: [{ id }, { pipelineId: id }] },
    select: {
      id: true,
      status: true,
      pipelineJobs: true,
      vulnCritical: true,
      vulnHigh: true,
      vulnMedium: true,
      vulnLow: true,
      startedAt: true,
      completedAt: true,
      imagePushed: true,
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      req.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch {}
      });

      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch { closed = true; }
      }

      function keepAlive() {
        if (closed) return;
        try { controller.enqueue(encoder.encode(": keep-alive\n\n")); }
        catch { closed = true; }
      }

      async function poll() {
        if (closed) return;
        try {
          const scan = await fetchScanStatus(id);
          if (!scan) { send({ error: "Not found" }); closed = true; return; }

          send({
            status: scan.status,
            pipelineJobs: scan.pipelineJobs,
            counts: {
              critical: scan.vulnCritical ?? 0,
              high: scan.vulnHigh ?? 0,
              medium: scan.vulnMedium ?? 0,
              low: scan.vulnLow ?? 0,
            },
            startedAt: scan.startedAt,
            completedAt: scan.completedAt,
            imagePushed: scan.imagePushed,
          });

          // Stop streaming once scan reaches terminal state
          if (TERMINAL_STATUSES.has(scan.status)) {
            send({ done: true, finalStatus: scan.status });
            closed = true;
            try { controller.close(); } catch {}
          }
        } catch (err) {
          console.error("[Scan SSE Poll Error]", err);
        }
      }

      await poll();
      const pollId = setInterval(poll, POLL_INTERVAL_MS);
      const kaId = setInterval(keepAlive, KEEP_ALIVE_MS);

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
      "X-Accel-Buffering": "no",
    },
  });
}
