// /app/scan/[id]/page.tsx  (server component - unwrap params)
import PipelineView from "@/components/PipelineView";
import ConfirmBuildButton from "@/components/ConfirmBuildButton";

type Props = { params: { id: string } };

// export async so we can await params (unwrap promise)
export default async function ScanPage({ params }: Props) {
  // params might be a Promise in some Next.js server environments
  const resolved = await params;
  const id = resolved?.id;

  if (!id) return <div>Missing id</div>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Pipeline / Scan Status</h1>

        {/* PipelineView is a client component that polls /api/scan/status/:id */}
        {/* It receives scanId as prop */}
        {/* Ensure PipelineView has "use client" at the top of its file */}
        <PipelineView scanId={id} />

        {/* ConfirmBuildButton must be a client component (has "use client") */}
        <ConfirmBuildButton scanId={id} />
      </div>
    </main>
  );
}
