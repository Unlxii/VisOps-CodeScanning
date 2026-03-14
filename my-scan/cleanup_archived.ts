
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("� Checking for archived projects...");

  const count = await prisma.projectGroup.count({
    where: { isActive: false },
  });

  if (count === 0) {
    console.log(" No archived projects found.");
    return;
  }

  console.log(`� Found ${count} archived projects. Deleting...`);

  const result = await prisma.projectGroup.deleteMany({
    where: { isActive: false },
  });

  console.log(` Successfully deleted ${result.count} archived projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
