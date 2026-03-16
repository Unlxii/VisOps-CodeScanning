
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.scanHistory.count();
    console.log(`Total ScanHistory records: ${count}`);
    
    const scans = await prisma.scanHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log("Recent scans:", JSON.stringify(scans, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
