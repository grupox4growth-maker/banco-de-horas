"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { FormState } from "@/lib/actions/auth";

export async function addNoteAction(_prev: FormState, f: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") return { error: "Não autorizado." };

  const userId = String(f.get("userId") || "");
  const date = String(f.get("date") || "");
  const tipo = String(f.get("tipo") || "obs");
  const texto = String(f.get("texto") || "").trim();
  if (!userId || !texto) return { error: "Escreva a mensagem." };

  await prisma.note.create({
    data: { userId, date, tipo, texto, autor: session.name || "Gerente", lida: false },
  });
  revalidatePath(`/employees/${userId}`);
  revalidatePath("/me");
  return { ok: true, message: "Aviso enviado." };
}

export async function markNoteReadAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const id = String(f.get("id") || "");
  if (!id) return;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return;
  // Funcionário só marca as próprias; gerente pode qualquer uma.
  if (session.role !== "MANAGER" && note.userId !== session.userId) return;
  await prisma.note.update({ where: { id }, data: { lida: true } });
  revalidatePath(`/employees/${note.userId}`);
  revalidatePath("/me");
}

export async function deleteNoteAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") return;
  const id = String(f.get("id") || "");
  const userId = String(f.get("userId") || "");
  if (id) {
    await prisma.note.deleteMany({ where: { id } });
    revalidatePath(`/employees/${userId}`);
    revalidatePath("/me");
  }
}
