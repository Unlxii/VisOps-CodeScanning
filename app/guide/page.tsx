// app/guide/page.tsx — Getting Started (index)
import Link from "next/link";
import { ArrowRight, Shield, Scan, Rocket, Key } from "lucide-react";

const cards = [
  {
    href: "/guide/scanners",
    icon: Shield,
    color: "blue",
    title: "Supported Scanners",
    desc: "Gitleaks, Semgrep, Trivy — สิ่งที่แต่ละตัวตรวจ และข้อจำกัด",
  },
  {
    href: "/guide/scan-build",
    icon: Rocket,
    color: "indigo",
    title: "Scan & Build Mode",
    desc: "Scan โค้ด + Build Docker Image + Push ไป Registry ในครั้งเดียว",
  },
  {
    href: "/guide/scan-only",
    icon: Scan,
    color: "purple",
    title: "Scan Only Mode",
    desc: "ตรวจสอบความปลอดภัยของ Source Code โดยไม่ต้อง Build",
  },
  {
    href: "/guide/architecture",
    icon: Key,
    color: "slate",
    title: "Architecture",
    desc: "โครงสร้างระบบ CI/CD Pipeline, Worker, Queue และ Database",
  },
];

const colorMap: Record<string, string> = {
  blue:   "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40",
  indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/40",
  slate:  "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export default function GuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-1 rounded-full mb-6">
        <Shield size={12} /> DevSecOps Platform
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        Getting Started with VisScan
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 leading-7 mb-10 max-w-2xl">
        VisScan Secure Pipeline คือแพลตฟอร์ม DevSecOps แบบครบวงจร ที่ช่วยตรวจสอบความปลอดภัยของ
        Source Code และ Container Image โดยอัตโนมัติ ผ่าน CI/CD Pipeline ที่ขับเคลื่อนด้วย
        Gitleaks, Semgrep และ Trivy
      </p>

      {/* Steps */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
          Quick Start — 3 ขั้นตอน
        </h2>
        <div className="space-y-4">
          {[
            { n: "1", title: "เข้าสู่ระบบ", desc: "Login ผ่าน CMU Account — ไม่ต้องสมัครสมาชิกใหม่" },
            { n: "2", title: "เพิ่ม Project", desc: "คลิก New Project → วาง Git Repository URL → กรอก GitHub Token" },
            { n: "3", title: "Start Scan", desc: "เลือกโหมด Scan Only หรือ Scan & Build แล้วกด Start" },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {n}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
          Explore the Docs
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group flex flex-col gap-3 p-5 rounded-xl border ${colorMap[c.color]} hover:shadow-md transition-all`}
            >
              <c.icon size={20} />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-1">{c.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-5">{c.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium mt-auto group-hover:gap-2 transition-all">
                Read more <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
