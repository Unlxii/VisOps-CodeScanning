"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Loader2, AlertTriangle, Check } from "lucide-react";

export default function ConfirmBuildButton({ scanId }: { scanId: string }) {
  const [status, setStatus] = useState<string>("loading");
  const [vulnCount, setVulnCount] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);

  // เช็คสถานะปัจจุบัน
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/scan/status/${scanId}`);
        const data = await res.json();
        
        if (data.status === "done" || data.status === "success") {
            setStatus("ready");
            setVulnCount(data.counts?.critical || 0);
        } else if (data.status === "failed") {
            setStatus("failed");
        } else {
            setStatus("running");
        }
      } catch (e) {
        console.error(e);
      }
    };

    // เช็คทุก 3 วินาที
    const interval = setInterval(checkStatus, 3000);
    checkStatus(); // เช็คทันทีครั้งแรก
    return () => clearInterval(interval);
  }, [scanId]);

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to push this image to Docker Hub?")) return;
    
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/scan/release/${scanId}`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        setDeployResult("success");
        alert("Release triggered successfully! Check Docker Hub shortly.");
      } else {
        setDeployResult("error");
        alert("Failed to release: " + data.error);
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setIsDeploying(false);
    }
  };

  if (status === "loading" || status === "running") {
    return null; // ยังไม่เสร็จ ไม่โชว์ปุ่ม
  }

  if (deployResult === "success") {
      return (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              Image has been released to Docker Hub.
          </div>
      );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Release Management</h3>
      <p className="text-sm text-slate-500 mb-4">
        Once the scan is complete and you have reviewed the findings, you can manually trigger the push to Docker Hub.
      </p>

      {vulnCount > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <strong>Warning:</strong> Found {vulnCount} critical vulnerabilities. 
            The image tag will have <code>-warning</code> appended automatically.
          </div>
        </div>
      )}

      <button
        onClick={handleRelease}
        disabled={isDeploying || status === "failed"}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all
          ${isDeploying ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"}
        `}
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <UploadCloud className="w-5 h-5" /> Push to Docker Hub
          </>
        )}
      </button>
    </div>
  );
}