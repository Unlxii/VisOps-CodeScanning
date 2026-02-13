"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  TrendingUp,
  ExternalLink,
  Eye,
  GitBranch,
  MoreHorizontal,
  Tag,
  RefreshCw
} from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";
import Tooltip from "@/components/ui/Tooltip";
import { ScanModeBadge, StatusBadge } from "@/components/pipeline/StatusBadges";
import { ProjectInfoModal } from "@/components/ProjectInfoModal";

// Redefine interfaces locally if not shared
interface ScanHistory {
  id: string;
  pipelineId: string | null;
  status: string;
  scanMode: string;
  imageTag: string;
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;
  startedAt: string;
  completedAt: string | null;
}

interface Service {
  id: string;
  serviceName: string;
  imageName: string;
  contextPath: string;
  scans: ScanHistory[];
}

interface Project {
  id: string;
  groupName: string;
  repoUrl: string;
  isActive: boolean;
  services: Service[];
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: { id: string; groupName: string; repoUrl: string }) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onRescan: (data: { serviceId: string; serviceName: string; lastScanMode: string }) => void;
}

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  isDeleting,
  onRescan,
}: ProjectCardProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Calculate overall status color
  const hasCritical = project.services.some(s => s.scans[0]?.vulnCritical > 0);
  const hasHigh = project.services.some(s => s.scans[0]?.vulnHigh > 0);
  const hasFailed = project.services.some(s => ["FAILED", "FAILED_SECURITY"].includes(s.scans[0]?.status || ""));
  const isRunning = project.services.some(s => ["RUNNING", "QUEUED"].includes(s.scans[0]?.status || ""));

  let statusColor = "slate";
  if (hasCritical || hasFailed) statusColor = "red";
  else if (hasHigh) statusColor = "orange";
  else if (isRunning) statusColor = "blue";
  else if (project.services.some(s => s.scans[0]?.status === "SUCCESS")) statusColor = "emerald";

  return (
    <>
      <div
        onClick={() => setIsInfoModalOpen(true)} // [NEW] Open modal on click
        className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer"
      >
        {/* Status Border */}
        <div className={`h-1.5 w-full bg-${statusColor}-500 transition-colors duration-300`} />

        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="min-w-0 pr-8">
            <h3
              className="font-bold text-slate-900 dark:text-white truncate text-lg tracking-tight mb-1"
              title={project.groupName}
            >
              {project.groupName}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <GitBranch size={12} />
              <span className="truncate max-w-[180px]">
                {project.repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            {/* Info button removed */}
            
            <Tooltip content="Edit Project Settings">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // [NEW] Stop propagation
                  onEdit({
                    id: project.id,
                    groupName: project.groupName,
                    repoUrl: project.repoUrl,
                  });
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Project Stats Banner */}
        <div className="bg-slate-50/50 dark:bg-slate-800/20 px-5 py-2 flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {project.services.length} Service{project.services.length !== 1 ? 's' : ''}
          </div>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Loader2 size={10} className="animate-spin" />
              Scanning...
            </div>
          )}
        </div>

        <div className="flex-1 p-5 space-y-3">
          {project.services.slice(0, 3).map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group/item"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {service.serviceName}
                  </p>
                  {service.scans[0] && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <StatusBadge status={service.scans[0].status} />
                      <ScanModeBadge mode={service.scans[0].scanMode} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px] flex items-center">
                    <Tag size={10} className="mr-1" />
                    {service.scans[0]?.imageTag || "latest"}
                  </div>

                  {/* Mini Vuln Badges */}
                  {service.scans[0] && (service.scans[0].vulnCritical > 0 || service.scans[0].vulnHigh > 0) && (
                    <div className="flex gap-1">
                      {service.scans[0].vulnCritical > 0 && (
                        <span className="text-[9px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                          {service.scans[0].vulnCritical} C
                        </span>
                      )}
                      {service.scans[0].vulnHigh > 0 && (
                        <span className="text-[9px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                          {service.scans[0].vulnHigh} H
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 pl-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <Tooltip content="Rescan">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const mode = service.scans[0]?.scanMode || "SCAN_AND_BUILD";
                      onRescan({
                        serviceId: service.id,
                        serviceName: service.serviceName,
                        lastScanMode: mode,
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                  >
                    <RefreshCw size={14} />
                  </button>
                </Tooltip>
                {service.scans[0]?.pipelineId && (
                  <Tooltip content="View Report">
                    <Link
                      href={`/scan/${service.scans[0].pipelineId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded block"
                    >
                      <Eye size={14} />
                    </Link>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
          {project.services.length > 3 && (
            <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800 mt-auto">
              +{project.services.length - 3} more services
            </p>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mt-auto">
          <Link
            href={`/scan/history?projectId=${project.id}`}
            onClick={(e) => e.stopPropagation()} // [NEW]
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
          >
            History <ExternalLink size={10} />
          </Link>
          <div className="flex gap-1 items-center">
            <div onClick={(e) => e.stopPropagation()}>
                <AddServiceDialog
                groupId={project.id}
                repoUrl={project.repoUrl}
                iconOnly
                />
            </div>
            <Tooltip content="Compare Scans">
              <Link
                href={`/scan/compare?projectId=${project.id}`}
                onClick={(e) => e.stopPropagation()} // [NEW]
                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors ml-1 block"
              >
                <TrendingUp size={14} />
              </Link>
            </Tooltip>
            <Tooltip content="Delete Project">
              <button
                onClick={(e) => {
                    e.stopPropagation(); // [NEW]
                    onDelete(project.id);
                }}
                disabled={isDeleting}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-1"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <ProjectInfoModal
        projectId={project.id}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </>
  );
}
