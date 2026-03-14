/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "UNLXI";
  const providedPassword = process.argv[3];
  const password = providedPassword || process.env.ADMIN_PASSWORD || "ChangeMe1234!"; // Use env or safe default
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // 1. Check how many admins already exist
    const adminCount = await prisma.user.count({
      where: { role: "SUPERADMIN" }
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Strict 1-Superadmin Enforcement Logic
    if (adminCount > 0) {
      // If an admin exists, we ONLY allow password resets for the *existing* admin.
      if (existingUser && existingUser.role === "SUPERADMIN") {
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        console.log(`
        ---------------------------------------------------
        [INFO] Superadmin found: ${email}
        [INFO] Password reset successfully.
        [INFO] Password: ${password}
        ---------------------------------------------------
        `);
        return;
      } else {
        console.error(`
        [ERROR] A Superadmin account already exists in the system.
        For security reasons, this system strictly allows only ONE Superadmin.
        Creation of additional admins is blocked.
        (To reset the password, run the script with the EXACT existing superadmin username.)
        `);
        process.exit(1);
      }
    }

    // 3. First-time Admin Creation or Promotion
    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "SUPERADMIN",
          password: hashedPassword,
        },
      });
      console.log(`
      ---------------------------------------------------
      [INFO] User found: ${email}
      [INFO] Promoted to Superadmin successfully.
      [INFO] Password: ${password}
      ---------------------------------------------------
      `);
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "UNLXI Administrator",
          role: "SUPERADMIN",
          password: hashedPassword,
          status: "ACTIVE",
          isSetupComplete: true,
        },
      });
      console.log(`
      ---------------------------------------------------
      [INFO] Superadmin user created: ${email}
      [INFO] Password: ${password}
      ---------------------------------------------------
      [WARNING] SAVE THIS SECURELY. ONLY 1 SUPERADMIN IS ALLOWED.
      ---------------------------------------------------
      `);
    }
  } catch (err) {
      console.error("[ERROR] Failed to create/update admin:", err);
      process.exit(1);
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
