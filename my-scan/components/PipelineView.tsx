// /components/PipelineView.tsx
"use client";

import React, { useEffect, useState } from "react";
import SeverityPills from "./SeverityPills";

type Run = {
  id: string;
  repoUrl: string;
  status: string;
  step: string;
  progress: number;
  counts: { critical: number; high: number; medium: number; low: number };
  logs?: string[];
  buildStatus?: string;
  pipelineUrl?: string;
};

export default function PipelineView({ scanId }: { scanId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/scan/status/${scanId}`);
      if (!res.ok) {
        setRun(null);
        return;
      }
      const j = await res.json();
      setRun(j);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 1500);
    return () => clearInterval(t);
  }, [scanId]);

  if (!run) return <div>Loading run...</div>;

  return (
  <div className="max-w-4xl mx-auto p-6">
    {/* Card */}
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Repository Scan
          </h2>
          <p className="text-sm text-gray-500">{run.repoUrl}</p>
        </div>

        <span
          className={`px-3 py-1 text-xs rounded-full font-medium
            ${
              run.status === "running"
                ? "bg-blue-100 text-blue-700"
                : run.status === "done"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
        >
          {run.status}
        </span>
      </div>

      {/* Pipeline Step */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Step: {run.step}</span>
          <span>{run.progress}%</span>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-blue-600 transition-all"
            style={{ width: `${run.progress}%` }}
          />
        </div>
      </div>

      {/* Severity */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Vulnerabilities
        </h3>
        <SeverityPills counts={run.counts} />
      </div>

      {/* Logs */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Latest logs
        </h3>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-3 max-h-52 overflow-auto font-mono text-xs">
          {(run.logs ?? []).slice(-20).map((l, i) => (
            <div key={i} className="opacity-90">
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Build status:{" "}
          <span className="font-medium text-gray-900">
            {run.buildStatus ?? "idle"}
          </span>
        </div>

        {run.pipelineUrl && (
          <a
            href={run.pipelineUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Open pipeline →
          </a>
        )}
      </div>
    </div>
  </div>
);

}
