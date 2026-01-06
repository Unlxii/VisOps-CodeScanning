"use client";

import { useRouter } from "next/navigation";
import { Layers, ArrowRight, CheckCircle, Loader2, XCircle, AlertTriangle } from "lucide-react";

type Props = {
  repoUrl: string;
  status: string;
};

export default function MonorepoAction({ repoUrl, status }: Props) {
  const router = useRouter();

  if (!repoUrl) return null;

  const isPending = status === "PENDING" || status === "running";
  const isFailed = status === "FAILED";
  const isSuccess = status === "SUCCESS";

  return (
    <div className={`rounded-xl p-1 shadow-sm border overflow-hidden mb-8 transition-colors
      ${isPending ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}
    `}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm text-blue-300 shrink-0">
            <Layers size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-white">Continue Monorepo Workflow</h3>
                
                {isPending && <span className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Current Job Running</span>}
                {isFailed && <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1"><XCircle size={10}/> Current Job Failed</span>}
                {isSuccess && <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1"><CheckCircle size={10}/> Ready for Next</span>}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              {isPending 
                ? "The current scan is still running. You can queue the next service now, or wait for this to finish."
                : "If this repository has other services (e.g., Frontend), you can scan them next using the same repository URL."
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/scan/build?repo=${encodeURIComponent(repoUrl)}`)}
          className="whitespace-nowrap flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-blue-500/20 active:translate-y-0.5"
        >
          Setup Next Service <ArrowRight size={18} />
        </button>
      </div>

      <div className="bg-slate-50 px-6 py-2 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
        {isSuccess ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-500" />}
        <span>
            {isSuccess 
                ? "Current job completed. Safe to proceed." 
                : "Note: Ensure your services don't depend on each other's build artifacts before proceeding."
            }
        </span>
      </div>
    </div>
  );
}