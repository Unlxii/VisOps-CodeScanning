/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "root";
  const providedPassword = process.argv[3] || process.env.ADMIN_PASSWORD;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const adminCount = await prisma.user.count({
      where: { role: "SUPERADMIN" }
    });

    if (existingUser && existingUser.role === "SUPERADMIN") {
      if (providedPassword) {
        const hashedPassword = await bcrypt.hash(providedPassword, 12);
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        console.log(`[INFO] Password updated for ${email}`);
      } else {
        console.log(`[INFO] Superadmin '${email}' already exists. Skipping setup.`);
      }
      return;
    }

    if (adminCount > 0 && (!existingUser || existingUser.role !== "SUPERADMIN")) {
       console.error(`[ERROR] A Superadmin already exists. Cannot create another.`);
       process.exit(1);
    }

    const password = providedPassword || crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "SUPERADMIN",
          password: hashedPassword,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "Super Administrator",
          role: "SUPERADMIN",
          password: hashedPassword,
          status: "APPROVED",
          isSetupComplete: true,
        },
      });
    }

    console.log(`
    ===================================================
    [SUCCESS] Superadmin account created/secured!
    [INFO] Username/Email: ${email}
    [INFO] Password: ${password}
    ===================================================
    [WARNING] PLEASE SAVE THIS PASSWORD SECURELY.
    ===================================================
    `);

  } catch (err) {
    console.error("[ERROR] Failed to setup Superadmin:", err);
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

