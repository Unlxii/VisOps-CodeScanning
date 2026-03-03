/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" Starting Superadmin Upgrade Migration...");

  try {
    // Find the oldest admin or the one designated as the root admin
    // Typically this is the first admin created in the system
    const oldestAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    });

    if (!oldestAdmin) {
      console.log("ℹ No existing ADMIN found. System is clean. You can run create-admin.ts instead.");
      return;
    }

    // Check if a SUPERADMIN already exists just in case
    const existingSuper = await prisma.user.findFirst({
        where: { role: "SUPERADMIN" }
    });

    if (existingSuper) {
        console.log(` SUPERADMIN already exists (${existingSuper.email}). No migration needed.`);
        return;
    }

    console.log(` Found oldest root admin: ${oldestAdmin.email}. Upgrading to SUPERADMIN...`);

    await prisma.user.update({
      where: { id: oldestAdmin.id },
      data: { role: "SUPERADMIN" },
    });

    console.log(` Upgrade complete! ${oldestAdmin.email} is now a SUPERADMIN.`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
