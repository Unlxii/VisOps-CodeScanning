"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  UserCircle2,
  Hash,
  GitBranch,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

// ปรับ Type ให้ตรงกับข้อมูลจริงที่มาจาก Prisma (Chain Relation)
type ScanItem = {
  id: string;
  status: string;
  imageTag: string;
  vulnCritical: number;
  vulnHigh: number;
  pipelineId: string;
  createdAt: string;
  service: {
    serviceName: string;
    group: {
      groupName: string;
      repoUrl: string;
      user: {
        name: string;
        email: string;
      };
    };
  };
};

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      // เรียก API ของ Admin เพื่อดึงข้อมูลของทุกคน
      const res = await fetch("/api/admin/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sort ซ้ำอีกครั้งที่ฝั่ง Client เพื่อความชัวร์ก่อน setHistory
          const sortedData = [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setHistory(sortedData);
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Confirm DELETE this record?`)) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/scan/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Auto refresh ทุก 10 วิ
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-purple-600" /> All Scan History
            </h1>
            <p className="text-sm text-slate-500">
              Monitoring all security scans from every users.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchHistory();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Owner / Service</th>
                <th className="p-4">Pipeline ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Vulnerabilities</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* User & Service Info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <UserCircle2 size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-none">
                          {item.service?.serviceName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-col">
                          <span className="text-blue-600 font-medium">
                            @{item.service?.group?.user?.name || "Anonymous"}
                          </span>
                          <span className="truncate max-w-[180px]">
                            Group: {item.service?.group?.groupName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pipeline ID */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm text-slate-700 font-bold font-mono">
                        <Hash size={12} className="text-slate-400" />{" "}
                        {item.pipelineId || "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono italic">
                        Tag: {item.imageTag}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.status === "SUCCESS"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : item.status === "FAILED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status === "SUCCESS" ? (
                        <CheckCircle size={12} />
                      ) : item.status === "FAILED" ? (
                        <XCircle size={12} />
                      ) : (
                        <Clock size={12} className="animate-pulse" />
                      )}
                      {item.status}
                    </span>
                  </td>

                  {/* Vulnerabilities */}
                  <td className="p-4">
                    <div className="flex gap-2">
                      {item.vulnCritical > 0 && (
                        <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.vulnCritical} Crit
                        </div>
                      )}
                      {item.vulnHigh > 0 && (
                        <div className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.vulnHigh} High
                        </div>
                      )}
                      {item.vulnCritical === 0 && item.vulnHigh === 0 && (
                        <span className="text-slate-400 text-xs italic">
                          No Threats
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="p-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString("th-TH")}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right flex items-center justify-end gap-1">
                    <Link
                      href={`/scan/${item.pipelineId}`}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Full Report"
                    >
                      <ExternalLink size={18} />
                    </Link>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Delete Entry"
                    >
                      {deletingId === item.id ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && history.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <UserCircle2 size={48} className="text-slate-200" />
              <p className="text-slate-400 font-medium">
                No global scan history available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
