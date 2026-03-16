import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("Successfully connected to database");

    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);

    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    console.log(`Found ${adminCount} admins in database`);
    
    // Check for CMU profile fields if any users exist
    if (userCount > 0) {
        const user = await prisma.user.findFirst();
        console.log("Sample User CMU Data:", {
            firstnameTH: user?.firstnameTH,
            organizationName: user?.organizationName,
            studentId: user?.studentId
        });
    }

  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
