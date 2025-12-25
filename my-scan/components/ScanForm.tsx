"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ScanFormProps {
  mode: "build" | "scan-only";
}

export default function ScanForm({ mode }: ScanFormProps) {
  const router = useRouter();
  
  // State เดิม
  const [repoUrl, setRepoUrl] = useState("");
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  
  // State ใหม่
  const [imageTag, setImageTag] = useState("latest");
  const [projectName, setProjectName] = useState(""); // เก็บชื่อโปรเจกต์ที่คำนวณได้
  
  const [loading, setLoading] = useState(false);

  // Effect: คำนวณชื่อ Project อัตโนมัติเมื่อ repoUrl เปลี่ยน
  useEffect(() => {
    if (!repoUrl) {
      setProjectName("");
      return;
    }
    try {
      // Logic: แยก string ด้วย / เอาตัวสุดท้าย และลบ .git ออก
      const parts = repoUrl.trim().split("/");
      let name = parts[parts.length - 1];
      if (name.endsWith(".git")) {
        name = name.replace(".git", "");
      }
      setProjectName(name || "scanned-project");
    } catch (e) {
      setProjectName("scanned-project");
    }
  }, [repoUrl]);

  async function handleStart() {
    console.log("--- DEBUGGING FORM SUBMIT ---");

    // Validation
    if (!repoUrl) return alert("Please enter Repository URL");
    
    const cleanRepo = repoUrl.trim();
    const cleanUser = dockerUser.trim();
    const cleanToken = dockerToken.trim();
    const cleanTag = imageTag.trim() || "latest";

    if (mode === "build" && (!cleanUser || !cleanToken)) {
      return alert("Docker credentials are required for Build mode.");
    }

    setLoading(true);
    try {
      const payload = {
        repoUrl: cleanRepo,
        // ใช้ key ให้ตรงกับที่ Backend API รอรับ (dockerUsername/Token)
        dockerUsername: mode === "build" ? cleanUser : undefined,
        dockerAccessToken: mode === "build" ? cleanToken : undefined,
        scanMode: mode,
        buildAfterScan: mode === "build",
        
        // ส่งตัวแปรเพิ่มเติมไปให้ Pipeline ใช้ตั้งชื่อ Image
        // (Backend ต้อง map ค่าเหล่านี้เข้า variables ของ GitLab)
        projectName: projectName,
        imageTag: cleanTag
      };

      console.log("Payload:", payload);

      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/scan/${data.scanId}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-4">
        {mode === "build" ? "Scan & Build Image" : "Security Scan Only"}
      </h2>

      {/* 1. Repo URL */}
      <div>
        <label className="block text-sm font-medium mb-1">Git Repository URL</label>
        <input
          type="text"
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        {projectName && (
          <p className="text-xs text-slate-500 mt-1">
            Detected Project Name: <span className="font-mono font-medium text-slate-700">{projectName}</span>
          </p>
        )}
      </div>

      {/* 2. Docker Settings (เฉพาะ Build Mode) */}
      {mode === "build" && (
        <div className="space-y-4 pt-4 border-t">
          <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
            <p className="font-semibold mb-1">Image Naming Preview:</p>
            <p className="font-mono text-xs break-all">
              index.docker.io/{dockerUser || "<user>"}/{projectName || "<project>"}:{imageTag || "latest"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Docker Hub Username</label>
              <input
                type="text"
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. mydockeruser"
                value={dockerUser}
                onChange={(e) => setDockerUser(e.target.value)}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Docker Access Token</label>
              <input
                type="password"
                className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Access Token"
                value={dockerToken}
                onChange={(e) => setDockerToken(e.target.value)}
              />
            </div>

            {/* ช่องกรอก Tag */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Target Image Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="latest"
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  (Default: latest)
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                * If critical vulnerabilities are found, "-warning" will be appended automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleStart}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded text-white font-medium transition shadow-sm
          ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? "Starting Pipeline..." : "Start Process"}
      </button>
    </div>
  );
}