// app/guide/scanners/page.tsx — Public scanners guide
import { ExternalLink, Shield, Key, Search, CheckCircle, AlertCircle } from "lucide-react";

const tools = [
  {
    id: "gitleaks",
    name: "Gitleaks",
    version: "v8.18.4",
    color: "red",
    Icon: Key,
    link: "https://gitleaks.io",
    description:
      "ตรวจสอบ Git Commit History เพื่อหารหัสผ่าน (Secrets), API Keys และ Tokens ที่เผลอหลุดเข้าไปใน Source Code",
    scans: ["Cloud Keys (AWS, GCP, Azure)", "Database Credentials", "Private Keys (RSA, PEM, SSH)", "API Tokens"],
    limitations: [
      "ไม่สามารถตรวจจับ Secrets ที่ถูกเข้ารหัส (Encrypted)",
      "ไม่สแกน Environment Variables บน Server",
      "ไฟล์ Binary หรือรูปภาพจะไม่ถูกสแกน",
    ],
  },
  {
    id: "semgrep",
    name: "Semgrep",
    version: "1.100.0",
    color: "orange",
    Icon: Search,
    link: "https://semgrep.dev",
    description:
      "วิเคราะห์โครงสร้างโค้ด (Static Analysis) เพื่อหาช่องโหว่ทางความปลอดภัยและ Logic Errors โดยเข้าใจ Syntax ของภาษาโปรแกรม",
    scans: ["OWASP Top 10", "Insecure Configuration", "Unsafe Function Usage", "Business Logic Flaws"],
    limitations: [
      "ไม่สามารถตรวจจับ Runtime Errors",
      "การวิเคราะห์ข้ามไฟล์มีข้อจำกัด",
      "ไม่ตรวจสอบ Network Infrastructure",
    ],
  },
  {
    id: "trivy",
    name: "Trivy",
    version: "0.53.0",
    color: "blue",
    Icon: Shield,
    link: "https://trivy.dev",
    description:
      "สแกนความปลอดภัยสำหรับ Cloud Native ครอบคลุม Docker Image, File System และ Dependencies เพื่อหาช่องโหว่ (CVEs)",
    scans: ["OS Package Vulnerabilities", "Application Dependencies", "Infrastructure as Code", "Image Misconfiguration"],
    limitations: [
      "ไม่ตรวจ Logic ของ Custom Code",
      "ไม่เจอ Zero-day Vulnerabilities",
      "ต้องต่อ Internet เพื่ออัปเดตฐานข้อมูล",
    ],
  },
];

export default function GuideScanners() {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Scanners</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        Supported Scanners
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7">
        ระบบใช้เครื่องมือสแกน 3 ตัวทำงานร่วมกันเพื่อครอบคลุมทุกมิติของความปลอดภัย
      </p>

      <div className="space-y-8">
        {tools.map((tool) => (
          <section key={tool.id} id={tool.id} className="scroll-mt-20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <tool.Icon size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">{tool.name}</h2>
                  <span className="text-xs text-slate-400">{tool.version}</span>
                </div>
              </div>
              <a
                href={tool.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Official Docs <ExternalLink size={11} />
              </a>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-6">{tool.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Detects
                  </h3>
                  <ul className="space-y-1.5">
                    {tool.scans.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-green-500 mt-0.5">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Limitations
                  </h3>
                  <ul className="space-y-1.5">
                    {tool.limitations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-orange-400 mt-0.5">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
