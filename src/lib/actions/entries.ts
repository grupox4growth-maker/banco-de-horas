"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { FormState } from "@/lib/actions/auth";

const norm = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

export async function saveEntryAction(_prev: FormState, f: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };

  const userId = String(f.get("userId") || "");
  const date = String(f.get("date") || "");
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Dados inválidos." };

  // Funcionário só pode registrar o próprio ponto.
  if (session.role !== "MANAGER" && session.userId !== userId) {
    return { error: "Não autorizado." };
  }

  const data = {
    entrada: norm(f.get("entrada")),
    saidaAlmoco: norm(f.get("saidaAlmoco")),
    voltaAlmoco: norm(f.get("voltaAlmoco")),
    intInicio: norm(f.get("intInicio")),
    intFim: norm(f.get("intFim")),
    saida: norm(f.get("saida")),
    obs: norm(f.get("obs")),
    updatedBy: session.role,
  };

  await prisma.timeEntry.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, ...data },
    update: data,
  });

  revalidatePath("/me");
  revalidatePath(`/employees/${userId}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Ponto salvo." };
}

export async function deleteEntryAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") return;
  const userId = String(f.get("userId") || "");
  const date = String(f.get("date") || "");
  if (userId && date) {
    await prisma.timeEntry.deleteMany({ where: { userId, date } });
    revalidatePath(`/employees/${userId}`);
    revalidatePath("/dashboard");
  }
}
