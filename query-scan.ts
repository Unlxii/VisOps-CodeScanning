import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const latestScan = await prisma.scanHistory.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("reportJson:", JSON.stringify(latestScan?.reportJson).substring(0, 500));
  console.log("details:", JSON.stringify(latestScan?.details).substring(0, 500));
}
main().catch(console.error).finally(() => prisma.$disconnect());
