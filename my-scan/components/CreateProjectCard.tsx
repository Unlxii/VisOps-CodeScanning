"use client";

import { Package, Plus, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateProjectCard() {
  const router = useRouter();

  return (
    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 transition-all duration-200 flex flex-col h-full min-h-[280px] p-6 hover:border-slate-400 dark:hover:border-slate-600 group/new">
      {/* Header */}
      <div className="text-center mb-6 mt-4">
        <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover/new:scale-110 transition-transform duration-300">
          <Plus className="w-6 h-6 text-blue-600 dark:text-blue-500" />
        </div>
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">
          New Project
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Start a new security scan
        </p>
      </div>
      
      {/* Options */}
      <div className="flex-1 flex flex-col gap-3 justify-center">
        {/* Scan & Build Option */}
        <button
          onClick={() => router.push("/scan/build")}
          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group/btn text-left shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover/btn:scale-110 transition-transform">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Scan & Build</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Full pipeline with Docker</p>
          </div>
        </button>

        {/* Scan Only Option */}
        <button
          onClick={() => router.push("/scan/scanonly")}
          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group/btn text-left shadow-sm hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover/btn:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Scan Only</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quick security audit</p>
          </div>
        </button>
      </div>
    </div>
  );
}
