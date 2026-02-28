import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@visops.local';
  const password = 'password123';
  const name = 'Super Admin';

  console.log(`Resetting admin user: ${email}`);

  // 1. Delete existing user if exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Found existing admin user. Deleting...');
    await prisma.user.delete({
      where: { email },
    });
    console.log('Deleted existing admin user.');
  }

  // 2. Create new user
  console.log('Creating new admin user...');
  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isSetupComplete: true,
      image: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff',
    },
  });

  console.log('------------------------------------------------');
  console.log('Admin user created successfully!');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('------------------------------------------------');
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
