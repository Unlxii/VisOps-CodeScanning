"use client";

// ScanLiveWatcher — mounts on the scan detail page when status is RUNNING or QUEUED.
// Opens SSE to /api/scan/[id]/stream, keeps the page live:
//  - Live elapsed timer (ticks every second)
//  - Calls router.refresh() when scan terminates so Server Component reloads vuln counts / download buttons

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Timer, CheckCircle, XCircle, ShieldAlert } from "lucide-react";

interface ScanLiveWatcherProps {
  scanId: string;
  initialStatus: string;
  startedAt: string | null;
}

const TERMINAL = new Set(["SUCCESS", "FAILED", "FAILED_SECURITY", "CANCELLED"]);

function formatElapsed(startMs: number, nowMs: number) {
  const diff = Math.max(0, nowMs - startMs);
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle size={14} className="text-green-500" />,
  FAILED: <XCircle size={14} className="text-red-500" />,
  FAILED_SECURITY: <ShieldAlert size={14} className="text-orange-500" />,
  CANCELLED: <XCircle size={14} className="text-gray-400" />,
};

export default function ScanLiveWatcher({
  scanId,
  initialStatus,
  startedAt,
}: ScanLiveWatcherProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState(TERMINAL.has(initialStatus));
  const esRef = useRef<EventSource | null>(null);

  // 1-second tick for elapsed time
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [done]);

  // SSE connection — only open if scan is still active
  useEffect(() => {
    if (TERMINAL.has(initialStatus)) return; // already done at render time

    const es = new EventSource(`/api/scan/${scanId}/stream`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status) setStatus(data.status);

        if (data.done) {
          setDone(true);
          es.close();
          // Reload the Server Component to get fresh vuln counts + download buttons
          router.refresh();
        }
      } catch {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [scanId, initialStatus, router]);

  const startMs = startedAt ? new Date(startedAt).getTime() : null;
  const elapsed = startMs ? formatElapsed(startMs, now) : null;
  const isTerminal = TERMINAL.has(status);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
        isTerminal
          ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300"
      }`}
    >
      {/* Status indicator */}
      <span className="flex items-center gap-1.5">
        {isTerminal ? (
          STATUS_ICON[status] ?? <CheckCircle size={14} />
        ) : (
          <Loader2 size={14} className="animate-spin" />
        )}
        <span className="capitalize font-semibold">{status.replace("_", " ")}</span>
      </span>

      {/* Elapsed timer — only shown while running */}
      {elapsed && !isTerminal && (
        <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 border-l border-blue-200 dark:border-blue-700 pl-3">
          <Timer size={11} />
          {elapsed}
        </span>
      )}

      {/* Refreshing indicator after terminal */}
      {done && (
        <span className="text-xs text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
          Refreshing…
        </span>
      )}
    </div>
  );
}
