import { prisma } from "@/lib/prisma";
import PipelineView from "@/components/PipelineView";
import ConfirmBuildButton from "@/components/ReleaseButton";
import MonorepoAction from "@/components/MonorepoAction";

type Props = { 
  params: Promise<{ id: string }> 
};

export const dynamic = "force-dynamic"; // ป้องกันการ Cache หน้า Result

export default async function ScanPage(props: Props) {
  const params = await props.params;
  const id = params.id;

  if (!id) return <div>Missing Project ID</div>;

  // ดึง repoUrl และ status มาพร้อมกัน
  const scanData = await prisma.scanHistory.findFirst({
    where: { scanId: id },
    select: { 
        repoUrl: true,
        status: true // ดึงสถานะมาด้วย
    }
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ส่วนหัว */}
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Scan Results</h1>
           <p className="text-slate-500 text-sm">Real-time security analysis and build pipeline status.</p>
        </div>

        {/* 1. แสดงผลกราฟและตาราง (สถานะละเอียดดูที่นี่) */}
        <PipelineView scanId={id} />

        {/* 1.5 Monorepo Action */}
        {/* ส่งทั้ง repoUrl และ status ไปแสดงผล */}
        {scanData?.repoUrl && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MonorepoAction 
                    repoUrl={scanData.repoUrl} 
                    status={scanData.status} 
                />
            </div>
        )}

        {/* 2. ปุ่มกดยืนยัน Release */}
        <div className="border-t border-slate-200 pt-8">
            <ConfirmBuildButton scanId={id} />
        </div>

      </div>
    </main>
  );
}