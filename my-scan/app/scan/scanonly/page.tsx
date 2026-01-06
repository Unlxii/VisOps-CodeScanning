// /app/scan/scanonly/page.tsx
import ScanForm from "@/components/ScanForm";

export default function ScanOnlyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan Only</h1>
          <p className="text-gray-500 text-sm mt-1">
            Security scan without building image
          </p>
        </div>
        <ScanForm buildMode={false} />
      </div>
    </div>
  );
}
