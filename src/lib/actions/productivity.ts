"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { FormState } from "@/lib/actions/auth";

export async function addProductivityAction(_prev: FormState, f: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") return { error: "Não autorizado." };

  const userId = String(f.get("userId") || "");
  const date = String(f.get("date") || "");
  const pontos = Math.round(Number(f.get("pontos")) || 0);
  const nota = String(f.get("nota") || "").trim() || null;
  if (!userId || !date) return { error: "Dados inválidos." };

  await prisma.productivity.create({
    data: { userId, date, pontos, nota, autor: session.name || "Gerente" },
  });
  revalidatePath(`/employees/${userId}`);
  revalidatePath("/produtividade");
  return { ok: true, message: "Lançamento registrado." };
}

export async function deleteProductivityAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") return;
  const id = String(f.get("id") || "");
  const userId = String(f.get("userId") || "");
  if (id) {
    await prisma.productivity.deleteMany({ where: { id } });
    revalidatePath(`/employees/${userId}`);
    revalidatePath("/produtividade");
  }
}
