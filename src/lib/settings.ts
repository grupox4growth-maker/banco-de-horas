import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/** Lê (ou cria) a configuração única do sistema, garantindo um código de convite. */
export async function getSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: "app" } });
  if (existing) return existing;
  return prisma.setting.create({
    data: { id: "app", registrationCode: randomBytes(9).toString("hex") },
  });
}

export async function regenerateRegistrationCode() {
  const code = randomBytes(9).toString("hex");
  return prisma.setting.upsert({
    where: { id: "app" },
    create: { id: "app", registrationCode: code },
    update: { registrationCode: code },
  });
}
