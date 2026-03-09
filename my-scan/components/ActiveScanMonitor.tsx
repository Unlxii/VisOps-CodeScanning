"use client";

import { mutate } from "swr";
import {
  Loader2,
  Activity,
  ArrowRight,
  Minus,
  Maximize2,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface ActiveScan {
  id: string;
  pipelineId: string | null;
  status: string;
  service?: {
    serviceName: string;
    imageName: string;
    averageDuration?: number | null;
  };
  startedAt: string;
}

function formatEta(ms: number): string {
  if (ms <= 0) return "wrapping up…";
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s left`;
  if (secs === 0) return `${mins}m left`;
  return `${mins}m ${secs}s left`;
}

export default function ActiveScanMonitor() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  // 1-second tick for real-time countdown display
  const [now, setNow] = useState(() => Date.now());
  const lastSyncRef = useRef<number>(0);
  const esRef = useRef<EventSource | null>(null);

  // Real-time countdown tick (independent of SSE)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { status } = useSession();

  // SSE connection — replaces SWR polling
  useEffect(() => {
    if (status !== "authenticated") return;
    
    function connect() {
      const es = new EventSource("/api/scan/stream/active");
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Server signals no more active scans
          if (data.done) {
            setActiveScans([]);
            mutate("/api/dashboard"); // refresh dashboard counts
            return;
          }

          if (Array.isArray(data.activeScans)) {
            setActiveScans(data.activeScans);
          }
        } catch {}
      };

      es.onerror = () => {
        // On error close and reconnect after 5s
        es.close();
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => esRef.current?.close();
  }, [status]);

  // Auto-sync: pull GitLab status, throttled to once every 5s
  useEffect(() => {
    if (activeScans.length === 0) return;
    const n = Date.now();
    if (n - lastSyncRef.current < 5000) return;
    lastSyncRef.current = n;

    activeScans.forEach(async (scan) => {
      try {
        await fetch(`/api/scan/${scan.id}/sync`, { method: "POST" });
      } catch {}
    });

    setTimeout(() => mutate("/api/dashboard"), 1200);
  }, [activeScans]);

  if (status !== "authenticated" || activeScans.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 ${
          isMinimized ? "w-64" : "w-80"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-semibold text-sm">
              Processing ({activeScans.length})
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-blue-100 hover:text-white p-1 hover:bg-white/10 rounded transition"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
          </button>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {activeScans.map((scan, index) => {
              // ETA using the 1s-ticking `now`
              let etaText = "";
              if (scan.status === "RUNNING") {
                const avgMs = scan.service?.averageDuration
                  ? scan.service.averageDuration + 900_000
                  : 1_200_000;
                const startedMs = new Date(scan.startedAt || now).getTime();
                const remainingMs = Math.max(0, avgMs - (now - startedMs));
                etaText = formatEta(remainingMs);
              } else {
                etaText = `~${(index + 1) * 3}m wait`;
              }

              return (
                <Link
                  key={scan.id}
                  href={scan.pipelineId ? `/scan/${scan.pipelineId}` : "#"}
                  className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition group relative overflow-hidden"
                >
                  {scan.status === "RUNNING" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-100 dark:bg-blue-900/30">
                      <div className="h-full bg-blue-500 dark:bg-blue-400 animate-progress" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          scan.status === "RUNNING"
                            ? "bg-blue-50 dark:bg-blue-900/30"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        {scan.status === "RUNNING" ? (
                          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold text-slate-500">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
                          {scan.service?.serviceName || "Unknown Service"}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-500 font-mono">
                            {scan.status}
                          </p>
                          {(scan.status === "QUEUED" ||
                            scan.status === "RUNNING") && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                                scan.status === "RUNNING"
                                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Timer size={9} />
                              {etaText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
