"use client";

import { CheckCircle2, Circle, Clock, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineJob {
  id: number;
  name: string;
  stage: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
}

interface PipelineStepperProps {
  jobs: PipelineJob[];
  status: string;
}

export default function PipelineStepper({ jobs, status }: PipelineStepperProps) {
  if (!jobs || jobs.length === 0) return null;

  // Group jobs by stage
  // We want a specific order: build -> test -> security-scan -> deploy (opt)
  // But strictly, we should follow the array order or stage order if provided.
  // Ideally, GitLab returns jobs, but "stages" are a separate concept. 
  // For simplicity, we'll map known stage names to a fixed order, or just unique them.
  
  // Custom sort order for standard VisScan stages
  const stageOrder = ["build", "test", "security-scan", "deploy"];
  
  // Deduplicate stages and keep them in order of appearance if not in standard list
  const uniqueStages: string[] = [];
  const jobsByStage: Record<string, PipelineJob[]> = {};

  jobs.forEach(job => {
    if (!uniqueStages.includes(job.stage)) {
      uniqueStages.push(job.stage);
    }
    if (!jobsByStage[job.stage]) {
      jobsByStage[job.stage] = [];
    }
    jobsByStage[job.stage].push(job);
  });

  // Sort stages: standard ones first, then others
  uniqueStages.sort((a, b) => {
    const idxA = stageOrder.indexOf(a);
    const idxB = stageOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  const getStageStatus = (stageJobs: PipelineJob[]) => {
    if (stageJobs.some(j => j.status === 'failed')) return 'failed';
    if (stageJobs.some(j => j.status === 'running')) return 'running';
    if (stageJobs.some(j => j.status === 'pending')) return 'pending';
    if (stageJobs.every(j => j.status === 'success' || j.status === 'skipped')) return 'success';
    if (stageJobs.every(j => j.status === 'created')) return 'pending';
    if (stageJobs.some(j => j.status === 'canceled')) return 'canceled';
    return 'pending';
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-500" />;
      case "running": return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending": return <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
      case "canceled": return <XCircle className="w-5 h-5 text-slate-400" />;
      default: return <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
    }
  };

   const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
        Pipeline Progress
      </h3>
      
      <div className="relative flex items-center justify-between w-full">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-0 -translate-y-1/2" />

        {uniqueStages.map((stage, index) => {
          const stageJobs = jobsByStage[stage];
          const stageStatus = getStageStatus(stageJobs);
          const isCompleted = stageStatus === 'success';
          const isRunning = stageStatus === 'running';
          const isFailed = stageStatus === 'failed';
          
          // Calculate total duration for stage (max of concurrent jobs usually, but sum is easier approx)
          // better: max(finished_at) - min(started_at) if all done?
          // Fallback: sum of durations
          const totalDuration = stageJobs.reduce((acc, j) => acc + (j.duration || 0), 0);

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                isCompleted ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50" :
                isRunning ? "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 scale-110" :
                isFailed ? "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50" :
                "bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700"
              )}>
                {getIcon(stageStatus)}
              </div>
              
              <div className="absolute top-12 flex flex-col items-center w-32">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-tight text-center",
                   isCompleted ? "text-emerald-700 dark:text-emerald-400" :
                   isRunning ? "text-blue-700 dark:text-blue-400" :
                   isFailed ? "text-red-700 dark:text-red-400" :
                   "text-slate-500 dark:text-slate-400"
                )}>
                  {stage.replace(/_/g, " ")}
                </span>
                
                {/* Duration Badge */}
                {totalDuration > 0 && (
                   <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1">
                      {formatDuration(totalDuration)}
                   </span>
                )}
                
                {/* Job Breakdown Tooltip (Simple List for now) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-10 bg-slate-900 text-white text-xs rounded p-2 w-max max-w-[200px] pointer-events-none z-20 shadow-xl">
                    {stageJobs.map(j => (
                        <div key={j.id} className="flex justify-between gap-4 py-0.5">
                            <span>{j.name}</span>
                            <span className={cn(
                                "uppercase text-[9px] font-bold",
                                j.status === 'success' ? "text-emerald-400" :
                                j.status === 'failed' ? "text-red-400" :
                                "text-slate-400"
                            )}>{j.status}</span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
