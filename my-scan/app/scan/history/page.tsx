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

// Helper: Check if scan is deletable (failed status)
const isDeletable = (status: string) => {
  const deletableStatuses = [
    "FAILED",
    "FAILED_SECURITY",
    "FAILED_BUILD",
    "CANCELLED",
    "ERROR",
  ];
  return deletableStatuses.includes(status);
};

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
      } else if (prev.length < 2) {
        return [...prev, scanId];
      }
      return prev;
    });
  };

  const handleCompare = () => {
    if (selectedScans.length === 2) {
      router.push(
        `/scan/compare?scan1=${selectedScans[0]}&scan2=${selectedScans[1]}`
      );
    }
  };

  const handleDelete = async (scanId: string) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;

    setDeletingId(scanId);
    try {
      const response = await fetch(`/api/scan/history?scanId=${scanId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setScans((prev) => prev.filter((s) => s.id !== scanId));
        setSelectedScans((prev) => prev.filter((id) => id !== scanId));
        setToast({ message: "Scan deleted successfully", type: "success" });
      } else {
        const error = await response.json();
        setToast({
          message: error.error || "Failed to delete scan",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to delete scan:", error);
      setToast({ message: "Failed to delete scan", type: "error" });
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
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          </div>
          <p className="text-gray-500 text-sm ml-14">
            {serviceId ? "Service specific scans" : "All scans"}
          </p>
        </div>

        {/* Compare Button */}
        {selectedScans.length === 2 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-medium">
                2 scans selected for comparison
              </span>
              <button
                onClick={handleCompare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Compare
              </button>
            </div>
          </div>
        )}

        {/* Scans List */}
        {scans.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No scan history yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vulnerabilities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedScans.includes(scan.id)}
                        onChange={() => handleSelectScan(scan.id)}
                        disabled={
                          !selectedScans.includes(scan.id) &&
                          selectedScans.length >= 2
                        }
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scan.service.serviceName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {scan.service.imageName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {scan.scanMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                      <div className="flex gap-2">
                        {scan.vulnCritical > 0 && (
                          <span className="text-red-600 font-bold">
                            🔴 {scan.vulnCritical}
                          </span>
                        )}
                        {scan.vulnHigh > 0 && (
                          <span className="text-orange-600">
                            🟠 {scan.vulnHigh}
                          </span>
                        )}
                        {scan.vulnMedium > 0 && (
                          <span className="text-yellow-600">
                            🟡 {scan.vulnMedium}
                          </span>
                        )}
                        {scan.vulnLow > 0 && (
                          <span className="text-gray-600">
                            ⚪ {scan.vulnLow}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(scan.startedAt).toLocaleString("th-TH")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {scan.pipelineId ? (
                          <button
                            onClick={() => handleViewDetails(scan)}
                            className="text-blue-600 hover:underline hover:text-blue-800 transition"
                          >
                            ดูรายละเอียด
                          </button>
                        ) : (
                          <span className="text-gray-400">ไม่มีข้อมูล</span>
                        )}

                        {/* Delete button - only for failed scans */}
                        {isDeletable(scan.status) && (
                          <button
                            onClick={() => handleDelete(scan.id)}
                            disabled={deletingId === scan.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition disabled:opacity-50"
                            title="Delete this scan record"
                          >
                            {deletingId === scan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
