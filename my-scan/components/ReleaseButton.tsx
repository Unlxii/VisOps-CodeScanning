"use client";
import { useState } from "react";
import {
  UploadCloud,
  Loader2,
  AlertTriangle,
  Rocket,
  ShieldAlert,
  X,
  CheckCircle2,
} from "lucide-react";

type Props = {
  scanId: string;
  status: string;
  vulnCount?: number;
  imagePushed?: boolean;
  onSuccess?: () => void;
};

export default function ConfirmBuildButton({
  scanId,
  status,
  vulnCount = 0,
  imagePushed = false,
  onSuccess,
}: Props) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localPushed, setLocalPushed] = useState(false);

  // Risk modal state
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const hasCritical = vulnCount > 0;
  const isCompleted = imagePushed || localPushed;

  const performPush = async () => {
    setIsDeploying(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/scan/confirm-push/${scanId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setLocalPushed(true);
        setShowRiskModal(false);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.error || "Failed to trigger release");
      }
    } catch {
      setErrorMessage("Network connection error");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRelease = () => {
    if (hasCritical) {
      // Show risk modal instead of proceeding directly
      setRiskAcknowledged(false);
      setShowRiskModal(true);
    } else {
      performPush();
    }
  };

  if (isCompleted) return null;
  if (status === "BLOCKED" || status === "FAILED") return null;

  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus !== "SUCCESS" && normalizedStatus !== "MANUAL" && normalizedStatus !== "FAILED_SECURITY")
    return null;

  return (
    <>
      {/* ── Main Card ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Ready for Release
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 max-w-2xl">
              {hasCritical
                ? "Critical vulnerabilities detected. You can still push, but you must acknowledge the risk first."
                : "Security scan passed. The image is safe to be pushed to your container registry."}
            </p>

            {hasCritical && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2 w-fit">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  <strong>{vulnCount} Critical</strong> vulnerabilit{vulnCount === 1 ? "y" : "ies"} found — push at your own risk
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
          </div>

          <button
            onClick={handleRelease}
            disabled={isDeploying}
            className={`group flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all whitespace-nowrap shadow-md hover:shadow-lg ${
              isDeploying
                ? "bg-slate-400 cursor-not-allowed"
                : hasCritical
                ? "bg-red-600 hover:bg-red-700 hover:-translate-y-0.5"
                : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
            }`}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {hasCritical ? "Push Anyway..." : "Confirm & Push"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Risk Acknowledgment Modal ── */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            {/* Red danger header */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Critical Risk Warning</h3>
                  <p className="text-red-200 text-xs">This action carries security risks</p>
                </div>
              </div>
              <button
                onClick={() => setShowRiskModal(false)}
                className="text-red-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                  {vulnCount} Critical Vulnerabilit{vulnCount === 1 ? "y" : "ies"} Detected
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Pushing this image to Docker Hub may expose your infrastructure to known security threats. This action is not recommended without remediation.
                </p>
              </div>

              {/* Acknowledgment Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={riskAcknowledged}
                    onChange={(e) => setRiskAcknowledged(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      riskAcknowledged
                        ? "bg-red-600 border-red-600"
                        : "border-slate-300 dark:border-slate-600 group-hover:border-red-400"
                    }`}
                  >
                    {riskAcknowledged && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                  I understand the security risks and accept full responsibility for pushing this image to Docker Hub despite the critical vulnerabilities.
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRiskModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={performPush}
                  disabled={!riskAcknowledged || isDeploying}
                  className={`flex-1 py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2 transition-all ${
                    riskAcknowledged && !isDeploying
                      ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
                      : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                  }`}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Pushing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Push Anyway
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
