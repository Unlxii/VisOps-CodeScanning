// app/guide/scan-build/page.tsx — Scan & Build mode guide
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GuideScanBuild() {
  const steps = [
    { n: "1", title: "Gitleaks Scan", desc: "ตรวจ Git history สำหรับ Secrets ที่หลุด — fail ทันทีถ้าเจอ" },
    { n: "2", title: "Semgrep SAST", desc: "วิเคราะห์ Source Code สำหรับ Security vulnerabilities" },
    { n: "3", title: "Build Docker Image", desc: "Kaniko build image จาก Dockerfile ใน Context Path ที่ระบุ" },
    { n: "4", title: "Trivy Scan (Image)", desc: "สแกน built image สำหรับ CVEs ใน OS packages และ dependencies" },
    { n: "5", title: "Push to Docker Hub", desc: "ถ้าทุกอย่างผ่าน pipeline จะ push image ขึ้น registry อัตโนมัติ (หรือ manual approval ถ้ามี critical)" },
  ];

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Modes</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        Scan & Build Mode
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7">
        โหมดนี้ทำการ Scan ความปลอดภัยของ Source Code <strong className="text-slate-700 dark:text-slate-200">พร้อมกับ Build Docker Image</strong> และ Push ขึ้น Docker Hub Registry โดยอัตโนมัติ
        เหมาะสำหรับ Production Deployment Pipeline
      </p>

      {/* Requirements */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Prerequisites
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "GitHub Token", desc: "Personal Access Token ที่มี repo scope" },
            { label: "Docker Hub Token", desc: "Access Token ที่มี Read/Write permission" },
            { label: "Dockerfile", desc: "ที่ root หรือ Context Path ที่ระบุ" },
            { label: "Image Name", desc: "ชื่อ image ที่จะ push เช่น username/my-app" },
          ].map((r) => (
            <div key={r.label} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Pipeline Steps
        </h2>
        <div className="relative pl-4">
          <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-5">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-slate-950 z-10">
                  {n}
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Note */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 text-sm">
        <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
          <AlertTriangle size={14} /> Push with Critical Vulnerabilities
        </p>
        <p className="text-amber-700 dark:text-amber-400">
          ถ้าพบ Critical vulnerability จะยังสามารถ push ได้ แต่จะมี Risk Acknowledgment modal ให้ยืนยันก่อน
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/guide/scan-only" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Scan Only mode
        </Link>
        <Link href="/guide/architecture" className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-auto">
          Architecture →
        </Link>
      </div>
    </div>
  );
}
