"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Search, ShieldAlert, User, Mail, Filter } from "lucide-react";
import { Severity, Vulnerability } from "./types";
import { SeverityBadge, ToolBadge } from "./StatusBadges";

interface FindingsTableProps {
  findings: Vulnerability[];
  isScanning: boolean;
  isSuccess: boolean;
  totalFindings: number;
}

const ITEMS_PER_PAGE = 10;

export const FindingsTable = ({
  findings,
  isScanning,
  isSuccess,
  totalFindings,
}: FindingsTableProps) => {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [toolFilter, setToolFilter] = useState<"all" | "Trivy" | "Semgrep" | "Gitleaks">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique tools from findings
  const availableTools = useMemo(() => {
    const tools = new Set(findings.map(f => f.sourceTool || "Unknown"));
    return Array.from(tools);
  }, [findings]);

  const filteredFindings = useMemo(() => {
    if (!findings) return [];
    let result = findings;
    if (filter !== "all") result = result.filter((f) => f.severity === filter);
    if (toolFilter !== "all") result = result.filter((f) => f.sourceTool === toolFilter);
    return result;
  }, [findings, filter, toolFilter]);

  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, toolFilter]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Findings ({filteredFindings.length})
            </h3>
          </div>
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            {(["all", "critical", "high", "medium", "low"] as const).map(
              (lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    filter === lvl ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {lvl}
                </button>
              )
            )}
          </div>
        </div>
        {/* Tool Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Scanner:</span>
          <div className="flex gap-1.5">
            {(["all", "Trivy", "Semgrep", "Gitleaks"] as const).map((tool) => {
              const count = tool === "all" ? findings.length : findings.filter(f => f.sourceTool === tool).length;
              const isActive = toolFilter === tool;
              const toolColors: Record<string, string> = {
                all: isActive ? "bg-slate-700 text-white dark:bg-slate-500" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400",
                Trivy: isActive ? "bg-cyan-600 text-white" : "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/30",
                Semgrep: isActive ? "bg-orange-600 text-white" : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30",
                Gitleaks: isActive ? "bg-purple-600 text-white" : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30",
              };
              return (
                <button
                  key={tool}
                  onClick={() => setToolFilter(tool)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${toolColors[tool]} hover:opacity-80`}
                >
                  {tool === "all" ? "All" : tool} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {paginatedFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
            {isScanning ? (
                // Scanning State
                <>
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <Search className="w-12 h-12 text-blue-500 relative z-10" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Scanning in progress...</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                        We are analyzing your codebase for vulnerabilities. New findings will appear here.
                    </p>
                </>
            ) : isSuccess && totalFindings === 0 ? (
                // Clean State
                <>
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Excellent! No Vulnerabilities</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                        Your code passed all security checks. No issues were found in this scan.
                    </p>
                </>
            ) : (
                // Empty Filter State
                <>
                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    </div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">No findings match your filter</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Try adjusting your search criteria or viewing all findings.
                    </p>
                </>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="p-4 pl-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase w-28 tracking-wider">
                  Severity
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Issue / Tool
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Location / Context
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedFindings.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 pl-6 align-top">
                    <SeverityBadge severity={item.severity} />
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <div className="font-medium text-slate-900 dark:text-white line-clamp-2 leading-relaxed" title={item.title || item.pkgName}>
                        {item.title || item.pkgName}
                      </div>
                      <div className="flex items-center gap-2">
                        <ToolBadge tool={item.sourceTool || "Unknown"} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top text-sm font-mono text-slate-600 dark:text-slate-400">
                    <div className="break-all mb-2 font-medium bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded w-fit text-xs border border-slate-200 dark:border-slate-700">
                       {item.pkgName}
                    </div>
                    {item.sourceTool === "Gitleaks" &&
                    (item.author || item.email) ? (
                      <div className="flex flex-col gap-1.5 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/50">
                        <div className="flex items-center gap-2 text-xs text-purple-800 font-semibold">
                          <User size={12} /> {item.author || "Unknown User"}
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-2 text-xs text-purple-600">
                            <Mail size={12} /> {item.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      item.installedVersion && (
                        <div className="flex items-center gap-2 text-xs">
                             <span className="text-slate-400">Version:</span>
                             <span className="font-medium text-slate-700">{item.installedVersion}</span>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredFindings.length > ITEMS_PER_PAGE && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-slate-800/50">
          <div className="text-xs text-gray-600 dark:text-slate-400 order-2 sm:order-1">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredFindings.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredFindings.length}
            </span>{" "}
            results
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="First page"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from(
                {
                  length: Math.ceil(filteredFindings.length / ITEMS_PER_PAGE),
                },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const totalPages = Math.ceil(
                    filteredFindings.length / ITEMS_PER_PAGE
                  );
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400 dark:text-slate-500 select-none">
                        •••
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded transition-all ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900"
                          : "text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded">
              <span>{currentPage}</span>
              <span className="text-gray-400 dark:text-slate-500">/</span>
              <span>{Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)}</span>
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    Math.ceil(filteredFindings.length / ITEMS_PER_PAGE),
                    p + 1
                  )
                )
              }
              disabled={
                currentPage ===
                Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
              }
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
                )
              }
              disabled={
                currentPage ===
                Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)
              }
              className="p-2 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Last page"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
