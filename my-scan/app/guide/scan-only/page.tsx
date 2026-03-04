// app/guide/scan-only/page.tsx
import Link from "next/link";
import { FileSearch, GitBranch, Zap, BarChart2, AlertTriangle } from "lucide-react";

export default function GuideScanOnly() {
  const steps = [
    { n: "1", title: "Gitleaks Scan", desc: "ตรวจ Git history สำหรับ Secrets — secrets จะถูก group ตาม rule" },
    { n: "2", title: "Semgrep SAST", desc: "สแกน Source Code สำหรับ OWASP Top 10 และ misconfiguration" },
    { n: "3", title: "Trivy Filesystem Scan", desc: "สแกน dependencies และ package lock files สำหรับ CVEs" },
  ];

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Modes</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        Scan Only Mode
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7">
        ตรวจสอบความปลอดภัยของ Source Code เท่านั้น โดย<strong className="text-slate-700 dark:text-slate-200">ไม่ build Docker Image</strong> เหมาะสำหรับ Code Review,
        Feature Branch Audit หรือ Repo ที่ยังไม่มี Dockerfile
      </p>

      {/* Use cases */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Use Cases
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { Icon: FileSearch, title: "Code Audit", desc: "ตรวจ Repository ที่ไม่มี Dockerfile" },
            { Icon: GitBranch, title: "Branch Check", desc: "สแกน Feature branch ก่อน merge" },
            { Icon: Zap, title: "Fast Scan", desc: "เร็วกว่า Scan & Build เพราะไม่ต้อง build image" },
          ].map((u) => (
            <div key={u.title} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="flex justify-center mb-2 text-slate-500 dark:text-slate-400">
                <u.Icon size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Pipeline Steps
        </h2>
        <div className="space-y-4">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {n}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Result */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-xl p-4 text-sm">
        <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1.5">
          <BarChart2 size={14} /> ผลลัพธ์
        </p>
        <p className="text-blue-700 dark:text-blue-400">
          ได้รับ Report JSON จาก Gitleaks, Semgrep และ Trivy พร้อม Critical / High / Medium / Low counts
          และสามารถ Download รายงานทั้งหมดได้จากหน้า Scan Detail
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/guide" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Getting Started
        </Link>
        <Link href="/guide/scan-build" className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-auto">
          Scan & Build →
        </Link>
      </div>
    </div>
  );
}
