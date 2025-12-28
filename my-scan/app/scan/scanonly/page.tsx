// /app/scan/scanonly/page.tsx
import ScanForm from "@/components/ScanForm";

export default function ScanOnlyPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Scan Only — Form</h1>
        <p className="text-sm mb-4">Provide repository to scan (mock).</p>
          <ScanForm buildMode={false} />
      </div>
    </main>
  );
}
