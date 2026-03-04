// app/guide/architecture/page.tsx
export default function GuideArchitecture() {
  const layers = [
    {
      title: "Frontend (Next.js)",
      color: "blue",
      items: [
        "Landing Page — public, no auth",
        "Dashboard — project & scan management",
        "Scan Detail — real-time pipeline view",
        "Admin Panel — user & system management",
      ],
    },
    {
      title: "API Layer (Next.js API Routes)",
      color: "indigo",
      items: [
        "/api/scan/start — queue scan job",
        "/api/scan/[id] — fetch scan status & findings",
        "/api/dashboard — aggregated project data",
        "/api/admin/* — admin-only operations",
      ],
    },
    {
      title: "Worker (Node.js)",
      color: "purple",
      items: [
        "Listens to RabbitMQ queues",
        "Triggers GitLab CI pipeline via API",
        "Polls pipeline status every 10s",
        "Downloads artifacts & stores in DB",
      ],
    },
    {
      title: "CI/CD Pipeline (GitLab)",
      color: "orange",
      items: [
        "gitleaks_scan — secrets detection",
        "semgrep_scan — SAST analysis",
        "build_image — Kaniko Docker build",
        "trivy_scan — container vulnerability scan",
        "push_to_hub — push to Docker Hub (manual gate)",
      ],
    },
    {
      title: "Infrastructure",
      color: "slate",
      items: [
        "PostgreSQL — stores scan results & user data",
        "RabbitMQ — job queue with priority lanes",
        "Docker Compose — production deployment",
        "GitLab Runner — CI/CD execution environment",
      ],
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10",
    indigo: "border-indigo-200 dark:border-indigo-800/40 bg-indigo-50 dark:bg-indigo-900/10",
    purple: "border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10",
    orange: "border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-900/10",
    slate: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40",
  };

  const titleColor: Record<string, string> = {
    blue: "text-blue-700 dark:text-blue-300",
    indigo: "text-indigo-700 dark:text-indigo-300",
    purple: "text-purple-700 dark:text-purple-300",
    orange: "text-orange-700 dark:text-orange-300",
    slate: "text-slate-700 dark:text-slate-300",
  };

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Architecture</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        System Architecture
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-7">
        VisScan ประกอบด้วยหลายส่วนทำงานร่วมกัน ตั้งแต่ Frontend ไปจนถึง CI/CD Pipeline
        และ Infrastructure layer
      </p>

      {/* Flow diagram text */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Request Flow
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          {["User (Browser)", "Next.js Frontend", "API Routes", "RabbitMQ", "Worker", "GitLab CI", "DB (PostgreSQL)"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
              </span>
            )
          )}
        </div>
      </section>

      {/* Layer cards */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Components
        </h2>
        <div className="space-y-4">
          {layers.map((layer) => (
            <div key={layer.title} className={`rounded-xl border p-5 ${colorMap[layer.color]}`}>
              <h3 className={`font-bold text-sm mb-3 ${titleColor[layer.color]}`}>{layer.title}</h3>
              <ul className="space-y-1.5">
                {layer.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
