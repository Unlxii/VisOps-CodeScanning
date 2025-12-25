"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react"; // ใช้ Icon สวยๆ

type Props = {
  buildMode: boolean;
};

// Type ของ Project ที่ Backend ส่งมาให้
type ProjectItem = {
  id: number;
  name: string;
  webUrl: string;
  createdAt: string;
};

export default function FormScan({ buildMode }: Props) {
  const [repoUrl, setRepoUrl] = useState("");
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- State สำหรับ Modal แจ้งเตือน Limit ---
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitProjects, setLimitProjects] = useState<ProjectItem[]>([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null); // สถานะกำลังลบ ID ไหน

  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      repoUrl,
      buildAfterScan: buildMode,
    };
    if (buildMode) {
      payload.dockerUsername = dockerUser;
      payload.dockerAccessToken = dockerToken;
    }

    try {
      // ยิงไปที่ Path ของคุณ (/api/scan/start)
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      setLoading(false);

      if (res.ok && j.scanId) {
        // สำเร็จ: ไปหน้า Pipeline
        router.push(`/scan/${j.scanId}`);
      } else if (res.status === 403 && j.error === "LIMIT_REACHED") {
        // กรณีโควตาเต็ม: เปิด Modal
        setLimitMessage(j.message);
        setLimitProjects(j.projects || []);
        setShowLimitModal(true);
      } else {
        // Error อื่นๆ
        alert("Failed to start scan: " + (j.error || JSON.stringify(j)));
      }
    } catch (err) {
      setLoading(false);
      alert("Network error. Please try again.");
    }
  }

  // ฟังก์ชันสั่งลบโปรเจกต์
  async function handleDelete(id: number) {
    if (!confirm("Confirm deletion of this project?")) return;
    
    setDeletingId(id);
    try {
      // ยิงไปที่ DELETE API ที่คุณสร้างไว้
      const res = await fetch(`/api/scan/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // ลบสำเร็จ: เอาออกจาก list ในหน้าจอ
        setLimitProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        const j = await res.json();
        alert("Delete failed: " + j.error);
      }
    } catch (e) {
      alert("Network error during delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* --- ฟอร์มหลัก --- */}
      <form onSubmit={onSubmit} className="max-w-xl mx-auto p-4 space-y-4">
        <div>
          <label className="block mb-1 font-medium">Git repository URL</label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {buildMode && (
          <>
            <div>
              <label className="block mb-1 font-medium">Docker username</label>
              <input
                value={dockerUser}
                onChange={(e) => setDockerUser(e.target.value)}
                placeholder="dockerhub username"
                required
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">
                Docker access token
              </label>
              <input
                value={dockerToken}
                onChange={(e) => setDockerToken(e.target.value)}
                placeholder="secret token"
                required
                type="password"
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button 
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-md shadow hover:bg-slate-700 disabled:opacity-60 transition-all"
          >
            {loading ? (
               <>
                 <Loader2 className="animate-spin" size={18} /> Starting...
               </>
            ) : (
               "Start Scan"
            )}
          </button>
        </div>
      </form>

      {/* --- Modal แจ้งเตือน Limit Reached --- */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Header */}
            <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-start">
              <div className="flex gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                   <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Limit Reached</h3>
                  <p className="text-sm text-slate-600 mt-1">{limitMessage}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLimitModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* List รายการโปรเจกต์ */}
            <div className="p-0 overflow-y-auto flex-1">
                {limitProjects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <div className="text-green-500 mb-2">✓ Available</div>
                        <p>You have cleared enough space!</p>
                        <p className="text-xs">Close this window and click Start Scan again.</p>
                    </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">Project Name</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {limitProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[150px]" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition disabled:opacity-50"
                              title="Delete this project"
                            >
                              {deletingId === p.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium text-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}