// /components/PipelineView.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  ShieldAlert, 
  ExternalLink,
  ChevronLeft, 
  ChevronRight,
  // Icons for tools
  Box,        // for Trivy
  Key,        // for Gitleaks
  FileCode,   // for Semgrep
  Search
} from "lucide-react";

// --- Types ---

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Vulnerability = {
  id: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: Severity;
  title?: string;
  description?: string;
  // เพิ่ม field นี้
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep";
};

type Run = {
  id: string;
  repoUrl: string;
  status: "pending" | "running" | "done" | "failed";
  step: string;
  progress: number;
  counts: { critical: number; high: number; medium: number; low: number };
  findings: Vulnerability[]; 
  logs?: string[];
  buildStatus?: string;
  pipelineUrl?: string;
  scanDuration?: string;
};

// --- Helper Components ---

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[severity]} uppercase tracking-wide`}>
      {severity}
    </span>
  );
};

// Component ใหม่: แสดงป้ายชื่อเครื่องมือ
const ToolBadge = ({ tool }: { tool: string }) => {
  let icon = <Box className="w-3 h-3" />;
  let style = "bg-gray-100 text-gray-700 border-gray-200";

  if (tool === "Gitleaks") {
    icon = <Key className="w-3 h-3" />;
    style = "bg-purple-100 text-purple-700 border-purple-200";
  } else if (tool === "Semgrep") {
    icon = <FileCode className="w-3 h-3" />;
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (tool === "Trivy") {
    icon = <Box className="w-3 h-3" />;
    style = "bg-blue-100 text-blue-700 border-blue-200";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${style} mr-2`}>
      {icon} {tool}
    </span>
  );
};

// --- Main Component ---

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/scan/status/${scanId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setRun((prev) => {
        if (prev?.status === "done" && data.status === "done") return prev;
        return data;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
        if (run?.status !== "done" && run?.status !== "failed") {
            fetchStatus();
        }
    }, 2000);
    return () => clearInterval(interval);
  }, [scanId, run?.status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const filteredFindings = useMemo(() => {
    if (!run?.findings) return [];
    if (filter === "all") return run.findings;
    return run.findings.filter((f) => f.severity === filter);
  }, [run, filter]);

  const totalPages = Math.ceil(filteredFindings.length / ITEMS_PER_PAGE);
  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500">Loading Report...</span>
      </div>
    );
  }

  if (!run) return <div className="p-6 text-center text-red-500">Run not found.</div>;

  const isScanning = run.status === "running" || run.status === "pending";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Unified Security Report</h1>
              <span className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1
                ${run.status === "running" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                  run.status === "done" ? "bg-green-50 text-green-700 border-green-200" : 
                  "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {run.status === "running" && <Loader2 className="w-3 h-3 animate-spin"/>}
                {run.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Project: <span className="font-mono text-gray-700">{run.repoUrl}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {run.pipelineUrl && (
              <a href={run.pipelineUrl} target="_blank" rel="noreferrer" 
                 className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                View in GitLab <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {run.scanDuration && (
               <div className="px-3 py-1 bg-gray-100 rounded-md font-mono text-xs">
                 ⏱ {run.scanDuration}
               </div>
            )}
          </div>
        </div>

        {isScanning && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 uppercase tracking-wide">
              <span>Current Status: {run.step}</span>
              <span>{run.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${run.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Logs */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Findings Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Critical", count: run.counts.critical, color: "text-red-600 bg-red-50 border-red-100" },
                { label: "High", count: run.counts.high, color: "text-orange-600 bg-orange-50 border-orange-100" },
                { label: "Medium", count: run.counts.medium, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
                { label: "Low", count: run.counts.low, color: "text-blue-600 bg-blue-50 border-blue-100" },
              ].map((stat) => (
                <div key={stat.label} className={`p-3 rounded-lg border text-center ${stat.color}`}>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-xs uppercase tracking-wider opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
             <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-mono text-gray-300">SCANNER LOGS</span>
             </div>
             <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 space-y-1">
                {(run.logs ?? []).length === 0 ? (
                  <span className="text-gray-600 italic">Waiting for logs...</span>
                ) : (
                  run.logs?.slice(-50).map((log, i) => (
                    <div key={i} className="break-all border-l-2 border-transparent hover:border-blue-500 pl-2">
                      <span className="text-gray-500 mr-2">{new Date().toLocaleTimeString()}</span>
                      {log}
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Detailed Findings Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
            
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Findings ({filteredFindings.length})</h3>
              </div>
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(["all", "critical", "high", "medium", "low"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilter(lvl)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all
                      ${filter === lvl 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {filteredFindings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                  {run.status === "done" ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                      <p className="text-gray-600 font-medium">No vulnerabilities found</p>
                      <p className="text-sm">Great job! Your code is secure.</p>
                    </>
                  ) : (
                     <p>Waiting for scan results...</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  {/* Table */}
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Severity</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue / Tool</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location / Version</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Solution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedFindings.map((item, idx) => (
                        <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 transition-colors group">
                          <td className="p-4 align-top">
                            <SeverityBadge severity={item.severity} />
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex flex-col gap-1">
                              {/* Title */}
                              <div className="font-medium text-gray-900 line-clamp-2">
                                {item.title || item.pkgName}
                              </div>
                              {/* Metadata Row: Tool Badge + ID */}
                              <div className="flex items-center flex-wrap gap-y-1">
                                <ToolBadge tool={item.sourceTool || "Unknown"} />
                                <span className="text-xs text-gray-500 font-mono">
                                  {item.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-top text-sm text-gray-600 font-mono">
                            <div className="break-all">{item.pkgName}</div>
                            {item.installedVersion !== "N/A" && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                v{item.installedVersion}
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-top text-sm font-medium font-mono">
                            {item.fixedVersion === "Code Fix" ? (
                                <span className="text-yellow-600">Manual Review</span>
                            ) : item.fixedVersion === "Revoke Secret" ? (
                                <span className="text-red-600">Revoke Now</span>
                            ) : item.fixedVersion ? (
                                <span className="text-blue-600">{item.fixedVersion}</span>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Footer */}
                  {filteredFindings.length > ITEMS_PER_PAGE && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                      <span className="text-xs text-gray-500">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredFindings.length)} of {filteredFindings.length}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1.5 text-xs font-medium bg-white border rounded-md min-w-[3rem] text-center">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}