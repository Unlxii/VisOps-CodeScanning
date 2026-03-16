
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true, role: true }
  });

  console.log("Current Admins:");
  admins.forEach(admin => {
    console.log(`- ${admin.name} (${admin.email}) [ID: ${admin.id}]`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
