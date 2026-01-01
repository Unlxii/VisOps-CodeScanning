// app/scan/compare/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Finding {
  file: string;
  line: number;
  ruleId: string;
  severity: string;
  message: string;
}

interface ComparisonResult {
  newFindings: Finding[];
  resolvedFindings: Finding[];
  persistentFindings: Finding[];
  scan1: any;
  scan2: any;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const scan1Id = searchParams.get("scan1");
  const scan2Id = searchParams.get("scan2");

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scan1Id && scan2Id) {
      fetchComparison();
    }
  }, [scan1Id, scan2Id]);

  const fetchComparison = async () => {
    try {
      const response = await fetch(`/api/scan/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId1: scan1Id, scanId2: scan2Id }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to compare scans");
      }
    } catch (error) {
      console.error("Failed to fetch comparison:", error);
      setError("Failed to fetch comparison");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "text-red-600 font-bold";
      case "HIGH":
        return "text-orange-600 font-semibold";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-4">
            {error || "Comparison data not found"}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Scan Comparison
            </h1>
          </div>
        </div>

        {/* Scan Comparison Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs font-medium text-gray-500 mb-3">
              BASELINE SCAN
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">
                {comparison.scan1.imageTag}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(comparison.scan1.startedAt).toLocaleString()}
              </div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Critical: {comparison.scan1.vulnCritical}
                </span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  High: {comparison.scan1.vulnHigh}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs font-medium text-gray-500 mb-3">
              CURRENT SCAN
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">
                {comparison.scan2.imageTag}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(comparison.scan2.startedAt).toLocaleString()}
              </div>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Critical: {comparison.scan2.vulnCritical}
                </span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  High: {comparison.scan2.vulnHigh}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-red-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {comparison.newFindings.length}
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              New Findings
            </div>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {comparison.resolvedFindings.length}
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">Resolved</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
              <div className="text-2xl font-bold text-gray-600">
                {comparison.persistentFindings.length}
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">Persistent</div>
          </div>
        </div>

        {/* New Findings */}
        {comparison.newFindings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              New Findings ({comparison.newFindings.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Line
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparison.newFindings.map((finding, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {finding.file}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {finding.line}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {finding.ruleId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {finding.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resolved Findings */}
        {comparison.resolvedFindings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              Resolved Findings ({comparison.resolvedFindings.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Line
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparison.resolvedFindings.map((finding, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {finding.file}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {finding.line}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {finding.ruleId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {finding.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Persistent Findings */}
        {comparison.persistentFindings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
              Persistent Findings ({comparison.persistentFindings.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Line
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Rule
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparison.persistentFindings.map((finding, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {finding.file}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {finding.line}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {finding.ruleId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
