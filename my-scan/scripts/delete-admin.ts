
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide an email to delete.");
    process.exit(1);
  }

  try {
    const user = await prisma.user.delete({
      where: { email },
    });
    console.log(`Deleted user: ${user.email} (${user.id})`);
  } catch (e) {
    console.error(`Failed to delete user ${email}:`, e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
