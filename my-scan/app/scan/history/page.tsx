"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/scan/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Auto Refresh ทุก 5 วินาที
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Scan History</h1>
        <button onClick={fetchHistory} className="text-slate-500 hover:text-blue-600 transition">
          <RefreshCw size={20} />
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Project Name</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Repo URL</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Image Tag</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Vulnerabilities</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  {item.status === "SUCCESS" && (
                    <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200">
                      <CheckCircle size={14} className="mr-1"/> Success
                    </span>
                  )}
                  {item.status === "FAILED" && (
                    <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-200">
                      <XCircle size={14} className="mr-1"/> Failed
                    </span>
                  )}
                  {item.status === "PENDING" && (
                    <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-medium border border-blue-200">
                      <Clock size={14} className="mr-1 animate-spin"/> Running
                    </span>
                  )}
                </td>
                <td className="p-4 font-medium text-slate-800">{item.projectName}</td>
                <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate" title={item.repoUrl}>
                  {item.repoUrl}
                </td>
                <td className="p-4 font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                  {item.imageTag}
                </td>
                <td className="p-4">
                  {item.vulnCritical > 0 ? (
                    <span className="text-red-600 font-bold flex items-center gap-1 text-sm">
                      <AlertTriangle size={16} /> {item.vulnCritical} Critical
                    </span>
                  ) : (
                    <span className="text-green-600 text-sm font-medium">Safe</span>
                  )}
                </td>
                <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  No scan history found. Start your first scan!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}