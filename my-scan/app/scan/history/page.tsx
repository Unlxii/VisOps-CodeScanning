// app/scan/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

interface Scan {
  id: string;
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

export default function ScanHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get("serviceId");

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [serviceId]);

  const fetchHistory = async () => {
    try {
      const url = serviceId
        ? `/api/scan/history?serviceId=${serviceId}`
        : "/api/scan/history";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED_SECURITY":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-gray-100 text-gray-800";
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
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
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          scan.status
                        )}`}
                      >
                        {scan.status}
                      </span>
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
                      <Link
                        href={`/scan/${scan.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </Link>
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
