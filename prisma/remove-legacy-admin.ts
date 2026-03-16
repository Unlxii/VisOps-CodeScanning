import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@local';

  console.log(`Checking for user: ${email}`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Found user: ${existingUser.name} (${existingUser.email}). Deleting...`);
    await prisma.user.delete({
      where: { email },
    });
    console.log('User deleted successfully.');
  } else {
    console.log('User not found.');
  }

  // Also check "Super Admin" generically if not found by email?
  // Let's stick to the email first as it's safer.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
