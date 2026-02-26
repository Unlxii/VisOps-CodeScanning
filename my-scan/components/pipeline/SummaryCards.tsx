import React from "react";
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface SummaryCardsProps {
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const SummaryCards = ({ counts }: SummaryCardsProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Findings Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Critical",
            count: counts.critical,
            color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30",
            icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          },
          {
            label: "High",
            count: counts.high,
            color: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30 hover:bg-orange-100 dark:hover:bg-orange-900/30",
            icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          },
          {
            label: "Medium",
            count: counts.medium,
            color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/30",
            icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          },
          {
            label: "Low",
            count: counts.low,
            color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/30",
            icon: <Info className="w-4 h-4 text-blue-600" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-lg border transition-all duration-200 ${stat.color} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
                {stat.icon}
            </div>
            <div className="text-3xl font-bold tracking-tight">{stat.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
