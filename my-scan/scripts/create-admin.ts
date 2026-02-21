import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "UNLXI";
  const providedPassword = process.argv[3];
  const password = providedPassword || "@UnlxiVisScan1234*"; // Default secure password
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // 1. Check how many admins already exist
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Strict 1-Superadmin Enforcement Logic
    if (adminCount > 0) {
      // If an admin exists, we ONLY allow password resets for the *existing* admin.
      if (existingUser && existingUser.role === "ADMIN") {
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        console.log(`
        ---------------------------------------------------
        ✅ Superadmin found: ${email}
        🔄 Password reset successfully.
        🔑 Password: ${password}
        ---------------------------------------------------
        `);
        return;
      } else {
        console.error(`
        ❌ ERROR: A Superadmin account already exists in the system.
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
          role: "ADMIN",
          password: hashedPassword,
        },
      });
      console.log(`
      ---------------------------------------------------
      ✅ User found: ${email}
      👑 Promoted to Superadmin successfully.
      🔑 Password: ${password}
      ---------------------------------------------------
      `);
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "UNLXI Administrator",
          role: "ADMIN",
          password: hashedPassword,
          status: "ACTIVE",
          isSetupComplete: true,
        },
      });
      console.log(`
      ---------------------------------------------------
      ✅ Superadmin user created: ${email}
      🔑 Password: ${password}
      ---------------------------------------------------
      ⚠️ SAVE THIS SECURELY. ONLY 1 SUPERADMIN IS ALLOWED.
      ---------------------------------------------------
      `);
    }
  } catch (err) {
      console.error("❌ Failed to create/update admin:", err);
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
