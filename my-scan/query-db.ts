import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const scans = await prisma.scanHistory.findMany({
    orderBy: { startedAt: "desc" },
    take: 5,
    select: {
      id: true,
      pipelineId: true,
      status: true,
      vulnCritical: true,
      vulnHigh: true,
    }
  });
  console.log("Recent 5 scans:");
  console.table(scans);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
