"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  ShieldAlert,
  Download,
  ExternalLink,
  Search,
  User,
  Mail,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  Sparkles,
} from "lucide-react";

import ConfirmBuildButton from "./ReleaseButton";

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
  sourceTool: "Trivy" | "Gitleaks" | "Semgrep";
  author?: string;
  email?: string;
  commit?: string;
};

type Run = {
  id: string;
  pipelineId: string;
  repoUrl: string;
  status: string;
  step: string;
  progress: number;
  counts: { critical: number; high: number; medium: number; low: number };
  findings: Vulnerability[];
  logs?: string[];
  pipelineUrl?: string;
  scanDuration?: string;
  rawReports?: {
    gitleaks?: any;
    semgrep?: any;
    trivy?: any;
  };
  criticalVulnerabilities?: Array<{
    id: string;
    pkgName: string;
    installedVersion: string;
    fixedVersion?: string;
    title: string;
    description?: string;
    severity: string;
  }>;
  serviceId?: string;
};

type ComparisonData = {
  canCompare: boolean;
  comparison?: {
    latest: {
      vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
      };
      scannedAt: string;
      imageTag: string;
    };
    previous: {
      vulnerabilities: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
      };
      scannedAt: string;
      imageTag: string;
    };
    changes: { critical: number; high: number; medium: number; low: number };
    trend: "improved" | "degraded" | "same";
    details: {
      fixed: number;
      new: number;
      persisting: number;
      fixedList: any[];
      newList: any[];
      persistingList: any[];
    };
  };
};

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[severity]} uppercase tracking-wide`}
    >
      {severity}
    </span>
  );
};

const ToolBadge = ({ tool }: { tool: string }) => {
  return (
    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 mr-2">
      {tool}
    </span>
  );
};

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  async function fetchComparison(serviceId: string) {
    try {
      const res = await fetch(`/api/scan/compare/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparison:", err);
    }
  }

  async function fetchStatus() {
    try {
      if (!scanId) return;
      // เรียก endpoint ที่ backend เตรียมไว้
      const res = await fetch(`/api/scan/status/${scanId}`);

      if (res.status === 404) {
        const errorData = await res.json();
        setError(errorData.details || "Pipeline not found in GitLab");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to fetch pipeline status");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setRun(data);
      setError(null);

      // Fetch comparison when scan completes
      if (
        data.serviceId &&
        (data.status === "SUCCESS" ||
          data.status === "FAILED_SECURITY" ||
          data.status === "BLOCKED")
      ) {
        fetchComparison(data.serviceId);
      }
    } catch (e) {
      console.error("Polling Error:", e);
      setError("An error occurred while fetching pipeline status");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      // Stop polling when pipeline reaches terminal state
      // Check both uppercase and lowercase for compatibility
      const status = run?.status?.toUpperCase();
      if (
        status !== "SUCCESS" &&
        status !== "FAILED" &&
        status !== "BLOCKED" &&
        status !== "CANCELED" &&
        status !== "CANCELLED" &&
        status !== "SKIPPED"
      ) {
        fetchStatus();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [scanId, run?.status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Download Handler
  const handleDownload = (reportName: string, data: any) => {
    if (!data) return alert("Report not available");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportName}-report.json`;
    link.click();
  };

  const filteredFindings = useMemo(() => {
    if (!run?.findings) return [];
    if (filter === "all") return run.findings;
    return run.findings.filter((f) => f.severity === filter);
  }, [run, filter]);

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              Pipeline Not Found
            </h3>
            <p className="text-red-700 mb-3">{error}</p>
            <p className="text-sm text-red-600">
              This pipeline (ID:{" "}
              <span className="font-mono font-semibold">{scanId}</span>) may
              have been deleted from GitLab or the project configuration is
              incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!run)
    return (
      <div className="p-6 text-center text-gray-500">Initializing Scan...</div>
    );

  // ✅ แสดง UI พิเศษสำหรับ QUEUED status
  const isQueued = run.status === "QUEUED" || (run as any).isQueued;
  const isScanning = run.status === "RUNNING" || run.status === "PENDING";
  const isBlocked = run.status === "BLOCKED";
  const isSuccess = run.status === "SUCCESS";
  const totalFindings =
    run.counts.critical + run.counts.high + run.counts.medium + run.counts.low;

  // ✅ Check if project is in healthy state (no vulnerabilities at all)
  const gitleaksCount = Array.isArray(run.rawReports?.gitleaks)
    ? run.rawReports.gitleaks.length
    : 0;
  const isHealthy =
    isSuccess &&
    run.counts.critical === 0 &&
    run.counts.high === 0 &&
    run.counts.medium === 0 &&
    run.counts.low === 0 &&
    gitleaksCount === 0;

  if (isQueued) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            Waiting in Queue
          </h3>
          <p className="text-blue-700 mb-4 max-w-md">
            Your scan is queued and will start processing soon. The worker will
            pick it up automatically.
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Position in queue: Processing will begin shortly
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      {/* Release Button - Show when scan is successful and not blocked */}
      {isSuccess && !isBlocked && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <ConfirmBuildButton scanId={scanId} />
        </div>
      )}

      {/* Comparison Section - Show when data available */}
      {comparison?.canCompare && comparison.comparison && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            Scan Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Latest */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Latest Scan</div>
              <div className="text-sm font-mono text-gray-700 mb-1">
                {comparison.comparison.latest.imageTag}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(
                  comparison.comparison.latest.scannedAt
                ).toLocaleString()}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${
                    comparison.comparison.trend === "improved"
                      ? "text-green-600"
                      : comparison.comparison.trend === "degraded"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {comparison.comparison.trend === "improved"
                    ? "✅"
                    : comparison.comparison.trend === "degraded"
                    ? "⚠️"
                    : "➡️"}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide mt-1">
                  {comparison.comparison.trend}
                </div>
              </div>
            </div>

            {/* Previous */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Previous Scan</div>
              <div className="text-sm font-mono text-gray-700 mb-1">
                {comparison.comparison.previous.imageTag}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(
                  comparison.comparison.previous.scannedAt
                ).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Changes Grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Critical", key: "critical", color: "red" },
              { label: "High", key: "high", color: "orange" },
              { label: "Medium", key: "medium", color: "yellow" },
              { label: "Low", key: "low", color: "blue" },
            ].map(({ label, key, color }) => {
              const comp = comparison.comparison!;
              const change = comp.changes[key as keyof typeof comp.changes];
              const current =
                comp.latest.vulnerabilities[
                  key as keyof typeof comp.latest.vulnerabilities
                ];
              const previous =
                comp.previous.vulnerabilities[
                  key as keyof typeof comp.previous.vulnerabilities
                ];

              return (
                <div
                  key={key}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {current}
                    </span>
                    {change !== 0 && (
                      <span
                        className={`text-xs font-semibold ${
                          change < 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    was {previous}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details Summary */}
          {comparison.comparison.details && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-700 font-semibold">
                  Fixed
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {comparison.comparison.details.fixed}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs text-red-700 font-semibold">New</div>
                <div className="text-2xl font-bold text-red-600">
                  {comparison.comparison.details.new}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-700 font-semibold">
                  Persisting
                </div>
                <div className="text-2xl font-bold text-gray-600">
                  {comparison.comparison.details.persisting}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Vulnerabilities Details - Show if blocked */}
      {isBlocked &&
        run.criticalVulnerabilities &&
        run.criticalVulnerabilities.length > 0 && (
          <div className="bg-red-50 rounded-xl shadow-sm border-2 border-red-300 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-900">
                  Release Blocked by Security
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  Found {run.criticalVulnerabilities.length} CRITICAL
                  vulnerabilities that must be fixed before release.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {run.criticalVulnerabilities.slice(0, 20).map((vuln, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-red-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          CRITICAL
                        </span>
                        <span className="font-mono text-sm text-gray-700">
                          {vuln.id}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {vuln.title}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                    <div>
                      <div className="text-xs text-gray-500">Package</div>
                      <div className="font-mono font-medium text-gray-900">
                        {vuln.pkgName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">
                        Current Version
                      </div>
                      <div className="font-mono text-red-600">
                        {vuln.installedVersion}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Fixed In</div>
                      <div className="font-mono text-green-600">
                        {vuln.fixedVersion || "N/A"}
                      </div>
                    </div>
                  </div>

                  {vuln.description && (
                    <p className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                      {vuln.description}
                    </p>
                  )}
                </div>
              ))}

              {run.criticalVulnerabilities.length > 20 && (
                <div className="text-center text-sm text-gray-600 py-2">
                  ... and {run.criticalVulnerabilities.length - 20} more
                  critical vulnerabilities
                </div>
              )}
            </div>
          </div>
        )}

      {/* Header Info */}
      <div
        className={`bg-white rounded-xl shadow-sm border p-6 ${
          isBlocked ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Scan Report</h1>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1
                ${
                  run.status === "RUNNING"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : run.status === "SUCCESS"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : isBlocked
                    ? "bg-red-100 text-red-700 border-red-200 font-bold"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }`}
              >
                {run.status === "RUNNING" && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {run.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Repo:{" "}
              <span className="font-mono text-gray-700">{run.repoUrl}</span>
            </p>
          </div>

          {/* Download Buttons */}
          {(run.status === "SUCCESS" || isBlocked) && run.rawReports && (
            <div className="flex gap-2">
              {run.rawReports.gitleaks && (
                <button
                  onClick={() =>
                    handleDownload("gitleaks", run.rawReports?.gitleaks)
                  }
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
                >
                  <Download size={14} /> Gitleaks JSON
                </button>
              )}
              {run.rawReports.semgrep && (
                <button
                  onClick={() =>
                    handleDownload("semgrep", run.rawReports?.semgrep)
                  }
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                >
                  <Download size={14} /> Semgrep JSON
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(isScanning || isBlocked || run.status === "SUCCESS") && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600 uppercase tracking-wide">
              <span>Status: {run.step}</span>
              <span>{run.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isBlocked ? "bg-red-600" : "bg-blue-600"
                }`}
                style={{ width: `${run.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary & Logs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Healthy State Banner */}
          {isHealthy && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-lg border-2 border-emerald-200 p-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-start gap-4">
                {/* <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-9 h-9 text-emerald-600" />
                  </div>
                </div> */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-emerald-900">
                      Security Health Score
                    </h3>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-sm font-bold rounded-full">
                      <Sparkles className="w-4 h-4" />
                      100%
                    </span>
                  </div>
                  <p className="text-emerald-800 font-medium mb-3">
                    All Systems Operational
                  </p>
                  <div className="space-y-1.5 text-sm text-emerald-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>No security vulnerabilities detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>No secrets or credentials exposed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Code analysis passed all checks</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">
                      Your code is clean and ready for deployment!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Counts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Findings Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Critical",
                  count: run.counts.critical,
                  color: "text-red-600 bg-red-50 border-red-100",
                },
                {
                  label: "High",
                  count: run.counts.high,
                  color: "text-orange-600 bg-orange-50 border-orange-100",
                },
                {
                  label: "Medium",
                  count: run.counts.medium,
                  color: "text-yellow-600 bg-yellow-50 border-yellow-100",
                },
                {
                  label: "Low",
                  count: run.counts.low,
                  color: "text-blue-600 bg-blue-50 border-blue-100",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 rounded-lg border text-center ${stat.color}`}
                >
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-xs uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-mono text-gray-300">LOGS</span>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-300 space-y-1">
              {run.logs && run.logs.length > 0 ? (
                run.logs.slice(-100).map((l, i) => (
                  <div key={i} className="break-all">
                    {l}
                  </div>
                ))
              ) : isSuccess && totalFindings === 0 ? (
                <div className="space-y-1">
                  <div>Pipeline: {run.pipelineId || scanId}</div>
                  <div>Status: SUCCESS</div>
                  <div className="text-green-400">
                    ✅ All security scans completed
                  </div>
                  <div className="text-green-400">
                    ✅ No vulnerabilities detected
                  </div>
                  <div>Duration: {run.scanDuration || "N/A"}</div>
                </div>
              ) : isSuccess ? (
                <div className="space-y-1">
                  <div>Pipeline: {run.pipelineId || scanId}</div>
                  <div>Status: SUCCESS</div>
                  <div>Total findings: {totalFindings}</div>
                  <div>Duration: {run.scanDuration || "N/A"}</div>
                </div>
              ) : (
                <div>Waiting for logs...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-800">
                  Findings ({filteredFindings.length})
                </h3>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(["all", "critical", "high", "medium", "low"] as const).map(
                  (lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFilter(lvl)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                        filter === lvl ? "bg-white shadow-sm" : "text-gray-500"
                      }`}
                    >
                      {lvl}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {paginatedFindings.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>
                    {isScanning
                      ? "Scanning for vulnerabilities..."
                      : isSuccess && totalFindings === 0
                      ? "✅ No vulnerabilities detected - All scans passed!"
                      : filter !== "all"
                      ? `No ${filter} findings found`
                      : "No findings to display"}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-24">
                        Severity
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                        Issue / Tool
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                        Location / Context
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedFindings.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 align-top">
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-gray-900 line-clamp-2">
                              {item.title || item.pkgName}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <ToolBadge tool={item.sourceTool || "Unknown"} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-600 font-mono">
                          <div className="break-all mb-2 font-medium">
                            {item.pkgName}
                          </div>
                          {item.sourceTool === "Gitleaks" &&
                          (item.author || item.email) ? (
                            <div className="flex flex-col gap-1.5 bg-purple-50 p-2.5 rounded-lg border border-purple-100">
                              <div className="flex items-center gap-2 text-xs text-purple-800 font-semibold">
                                <User size={12} />{" "}
                                {item.author || "Unknown User"}
                              </div>
                              {item.email && (
                                <div className="flex items-center gap-2 text-xs text-purple-600">
                                  <Mail size={12} /> {item.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            item.installedVersion && (
                              <span className="text-xs text-gray-400 bg-gray-50 p-1 px-2 rounded">
                                v{item.installedVersion}
                              </span>
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
              <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <div className="text-xs text-gray-600 order-2 sm:order-1">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredFindings.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredFindings.length}
                  </span>{" "}
                  results
                </div>
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from(
                      {
                        length: Math.ceil(
                          filteredFindings.length / ITEMS_PER_PAGE
                        ),
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
                            <span className="px-2 text-gray-400 select-none">
                              •••
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded transition-all ${
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded">
                    <span>{currentPage}</span>
                    <span className="text-gray-400">/</span>
                    <span>
                      {Math.ceil(filteredFindings.length / ITEMS_PER_PAGE)}
                    </span>
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
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
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
                    className="p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
        </div>
      </div>
    </div>
  );
}
