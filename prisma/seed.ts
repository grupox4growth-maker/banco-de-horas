import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.SEED_MANAGER_USERNAME || "gerente").toLowerCase();
  const password = process.env.SEED_MANAGER_PASSWORD;
  if (!password) {
    throw new Error("Defina SEED_MANAGER_PASSWORD no .env antes de rodar o seed.");
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const manager = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      name: process.env.SEED_MANAGER_NAME || "Gerente",
      username,
      email: process.env.SEED_MANAGER_EMAIL || null,
      role: "MANAGER",
      passwordHash,
    },
  });

  console.log(`✔ Conta de gerente pronta: usuário "${manager.username}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
