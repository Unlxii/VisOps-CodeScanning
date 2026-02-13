import { CheckCircle2, Circle, Clock, Loader2, XCircle } from "lucide-react";

interface ScanLog {
  status: string;
  timestamp: string;
  message?: string;
}

interface ScanTimelineProps {
  logs: ScanLog[];
  status: string;
}

export default function ScanTimeline({ logs, status }: ScanTimelineProps) {
  if (!logs || logs.length === 0) return null;

  // Sort logs by timestamp
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getIcon = (logStatus: string) => {
    switch (logStatus) {
      case "QUEUED":
        return <Clock className="w-4 h-4 text-slate-500" />;
      case "RUNNING":
      case "BUILDING":
      case "SCANNING":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "SUCCESS":
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
      case "FAILED_TRIGGER":
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500" /> Scan Timeline
      </h3>
      <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
        {sortedLogs.map((log, index) => (
          <div key={index} className="relative pl-6">
            <div className="absolute -left-[21px] top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center z-10">
              {getIcon(log.status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {log.status.replace(/_/g, " ")}
                </p>
                {log.message && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {log.message}
                  </p>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {formatTime(log.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
