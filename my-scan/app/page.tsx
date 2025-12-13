// /app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full p-6 space-y-6">
        <h1 className="text-2xl font-bold">
          VisScan — Code & Image Scanning (Mock)
        </h1>
        <p>Choose how you want to scan the repository:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/scan/build"
            className="block border p-6 rounded hover:shadow"
          >
            <h3 className="text-lg font-semibold">Scan & Build</h3>
            <p className="text-sm">
              Scan code and optionally build/push Docker image after confirm
            </p>
          </Link>

          <Link
            href="/scan/scanonly"
            className="block border p-6 rounded hover:shadow"
          >
            <h3 className="text-lg font-semibold">Scan only</h3>
            <p className="text-sm">
              Only run security scans (gitleaks, semgrep, trivy) and show
              results
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
