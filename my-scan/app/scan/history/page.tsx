// app/scan/history/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface Scan {
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
  service: {
    serviceName: string;
    imageName: string;
  };
}

function ScanHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("serviceId");

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch history with useCallback for stability
  const fetchHistory = useCallback(async () => {
    try {
      const url = serviceId
        ? `/api/scan/history?serviceId=${serviceId}`
        : "/api/scan/history";

      const response = await fetch(url);
      if (response.status === 401) {
        // Redirect to login if unauthorized
        router.replace("/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSelectScan = (scanId: string) => {
    setSelectedScans((prev) => {
      if (prev.includes(scanId)) {
        return prev.filter((id) => id !== scanId);
      } else {
        return [...prev, scanId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedScans.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedScans.length} scan record(s)?`
      )
    )
      return;

    setDeletingId("bulk");
    try {
      const deletePromises = selectedScans.map((scanId) =>
        fetch(`/api/scan/history?scanId=${scanId}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.ok).length;

      setScans((prev) => prev.filter((s) => !selectedScans.includes(s.id)));
      setSelectedScans([]);

      setToast({
        message: `Successfully deleted ${successCount} scan(s)`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete scans:", error);
      setToast({ message: "Failed to delete scans", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Navigate to scan details with proper handling
  const handleViewDetails = (scan: Scan) => {
    if (scan.pipelineId) {
      router.push(`/scan/${scan.pipelineId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return "bg-green-100 text-green-800";
      case "FAILED_SECURITY":
        return "bg-red-100 text-red-800";
      case "FAILED":
      case "FAILED_BUILD":
      case "ERROR":
        return "bg-gray-100 text-gray-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PASSED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "FAILED":
      case "FAILED_SECURITY":
      case "FAILED_BUILD":
      case "ERROR":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "RUNNING":
      case "QUEUED":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="bg-white rounded-xl border overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
              <p className="text-gray-500 text-sm mt-1">
                {serviceId
                  ? "Viewing scans for a specific service"
                  : `All your security scans (${scans.length} total)`}
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Delete Button */}
        {selectedScans.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-red-900 font-semibold text-lg">
                  {selectedScans.length} scan(s) selected for deletion
                </span>
                <p className="text-red-700 text-sm mt-1">
                  Remove selected scans from history permanently
                </p>
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={deletingId === "bulk"}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {deletingId === "bulk" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Scans List */}
        {scans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Scan History Yet
              </h3>
              <p className="text-gray-500 mb-6">
                {serviceId
                  ? "This service hasn't been scanned yet. Start a new scan to see results here."
                  : "You haven't run any scans yet. Create a new project to get started."}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Delete
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vulnerabilities
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => {
                  const totalVulns =
                    scan.vulnCritical +
                    scan.vulnHigh +
                    scan.vulnMedium +
                    scan.vulnLow;

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => scan.pipelineId && handleViewDetails(scan)}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedScans.includes(scan.id)}
                          onChange={() => handleSelectScan(scan.id)}
                          className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                          title="Select for deletion"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {scan.service.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {scan.service.imageName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
                            scan.scanMode === "SCAN_ONLY"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                          title={
                            scan.scanMode === "SCAN_ONLY"
                              ? "Security scan without image build"
                              : "Security scan with Docker image build"
                          }
                        >
                          {scan.scanMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {scan.imageTag}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(scan.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              scan.status
                            )}`}
                          >
                            {scan.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 items-center">
                          {totalVulns === 0 ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Clean
                            </span>
                          ) : (
                            <>
                              {scan.vulnCritical > 0 && (
                                <span
                                  className="text-red-700 font-bold px-2 py-1 bg-red-50 rounded"
                                  title={`${scan.vulnCritical} Critical vulnerabilities`}
                                >
                                  🔴 {scan.vulnCritical}
                                </span>
                              )}
                              {scan.vulnHigh > 0 && (
                                <span
                                  className="text-orange-700 font-semibold px-2 py-1 bg-orange-50 rounded"
                                  title={`${scan.vulnHigh} High vulnerabilities`}
                                >
                                  🟠 {scan.vulnHigh}
                                </span>
                              )}
                              {scan.vulnMedium > 0 && (
                                <span
                                  className="text-yellow-700 px-2 py-1 bg-yellow-50 rounded"
                                  title={`${scan.vulnMedium} Medium vulnerabilities`}
                                >
                                  🟡 {scan.vulnMedium}
                                </span>
                              )}
                              {scan.vulnLow > 0 && (
                                <span
                                  className="text-gray-700 px-2 py-1 bg-gray-50 rounded text-xs"
                                  title={`${scan.vulnLow} Low vulnerabilities`}
                                >
                                  ⚪ {scan.vulnLow}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(scan.startedAt).toLocaleString("th-TH")}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {scan.pipelineId ? (
                          <button
                            onClick={() => handleViewDetails(scan)}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition font-medium"
                          >
                            View Details
                          </button>
                        ) : (
                          <span
                            className="text-gray-400"
                            title="Pipeline data not available"
                          >
                            No data
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense wrapper for useSearchParams
export default function ScanHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ScanHistoryContent />
    </Suspense>
  );
}
