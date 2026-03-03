"use client";

import { Download } from "lucide-react";

interface ScanDownloadButtonProps {
  label: string;
  data: any;
  color: 'purple' | 'emerald' | 'blue';
}

export default function ScanDownloadButton({ label, data, color }: ScanDownloadButtonProps) {
  const handleDownload = () => {
    if (!data) return alert("Report not available");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${label.toLowerCase()}-report.json`;
    link.click();
  };

  const colorClasses = {
      purple: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-900/50",
      emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-900/50",
      blue: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-900/50"
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition ${colorClasses[color]}`}
    >
      <Download size={14} /> {label}
    </button>
  );
}
