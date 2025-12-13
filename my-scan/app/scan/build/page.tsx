// /app/scan/build/page.tsx
import dynamic from "next/dynamic";
import FormScan from "@/components/FormScan";

export default function BuildPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Scan & Build — Form</h1>
        <p className="text-sm mb-4">
          Provide repository and Docker Hub credentials (mock). Tokens are not
          stored in this demo.
        </p>
        <FormScan buildMode />
      </div>
    </main>
  );
}
