"use client";
import React from "react";
import { ShieldAlert, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComparisonData } from "./types";

interface ComparisonSectionProps {
  comparison: ComparisonData;
}

export const ComparisonSection = ({ comparison }: ComparisonSectionProps) => {
  if (!comparison.canCompare || !comparison.comparison) return null;

  const comp = comparison.comparison;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800/30 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        Scan Comparison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Latest */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">Latest Scan</div>
          <div className="text-sm font-mono text-gray-700 dark:text-slate-300 mb-1">
            {comp.latest.imageTag}
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500">
            {new Date(comp.latest.scannedAt).toLocaleString()}
          </div>
        </div>

        {/* Trend */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${
                comp.trend === "improved"
                  ? "text-green-600"
                  : comp.trend === "degraded"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {comp.trend === "improved" ? (
                <TrendingUp className="w-8 h-8 mx-auto" />
              ) : comp.trend === "degraded" ? (
                <TrendingDown className="w-8 h-8 mx-auto" />
              ) : (
                <Minus className="w-8 h-8 mx-auto" />
              )}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide mt-1">
              {comp.trend}
            </div>
          </div>
        </div>

        {/* Previous */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">Previous Scan</div>
          <div className="text-sm font-mono text-gray-700 dark:text-slate-300 mb-1">
            {comp.previous.imageTag}
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500">
            {new Date(comp.previous.scannedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Changes Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical", key: "critical", color: "red" },
          { label: "High", key: "high", color: "orange" },
          { label: "Medium", key: "medium", color: "yellow" },
          { label: "Low", key: "low", color: "blue" },
        ].map(({ label, key }) => {
          const change = comp.changes[key as keyof typeof comp.changes];
          const current =
            comp.latest.vulnerabilities[
              key as keyof typeof comp.latest.vulnerabilities
            ];
          const previous =
            comp.previous.vulnerabilities[
              key as keyof typeof comp.previous.vulnerabilities
            ];

          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700"
            >
              <div className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {current}
                </span>
                {change !== 0 && (
                  <span
                    className={`text-xs font-semibold ${
                      change < 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {change > 0 ? "+" : ""}
                    {change}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">was {previous}</div>
            </div>
          );
        })}
      </div>

      {/* Details Summary */}
      {comp.details && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg p-3">
            <div className="text-xs text-green-700 font-semibold">Fixed</div>
            <div className="text-2xl font-bold text-green-600">
              {comp.details.fixed}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
            <div className="text-xs text-red-700 font-semibold">New</div>
            <div className="text-2xl font-bold text-red-600">
              {comp.details.new}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
            <div className="text-xs text-gray-700 dark:text-slate-400 font-semibold">
              Persisting
            </div>
            <div className="text-2xl font-bold text-gray-600 dark:text-slate-300">
              {comp.details.persisting}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
