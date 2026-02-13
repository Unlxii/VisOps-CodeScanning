import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    
    // Attempt to query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    const users = await prisma.user.findMany({ select: { email: true } });
    console.log('Users found:', users);

  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
