// /app/scan/build/page.tsx
import ScanForm from "@/components/ScanForm";

export default function BuildPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan & Build</h1>
          <p className="text-gray-500 text-sm mt-1">
            Scan source code and build Docker image
          </p>
        </div>
        <ScanForm buildMode />
      </div>
    </div>
  );
}
