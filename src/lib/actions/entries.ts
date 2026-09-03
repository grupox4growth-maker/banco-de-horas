"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { nowInPunchTZ } from "@/lib/time";
import type { FormState } from "@/lib/actions/auth";

const PUNCH_SEGS = ["entrada", "saidaAlmoco", "voltaAlmoco", "intInicio", "intFim", "saida"];

/* ---- BATER PONTO AGORA (horário do servidor, 1 toque, não editável pelo funcionário) ---- */
export async function punchNowAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const segment = String(f.get("segment") || "");
  if (!PUNCH_SEGS.includes(segment)) return;

  const userId = session.userId; // o funcionário só bate o próprio ponto
  const { date, time } = nowInPunchTZ();

  const existing = await prisma.timeEntry.findUnique({ where: { userId_date: { userId, date } } });
  // Não sobrescreve um ponto já registrado (evita "refazer" a hora).
  if (existing && (existing as Record<string, unknown>)[segment]) return;

  const data: Record<string, unknown> = { [segment]: time, updatedBy: session.role };
  await prisma.timeEntry.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, ...data },
    update: data,
  });
  revalidatePath("/me");
  revalidatePath(`/employees/${userId}`);
  revalidatePath("/dashboard");
}

/* ---- Observação do dia (o funcionário pode escrever; é texto, não horário) ---- */
export async function saveObservationAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const obs = String(f.get("obs") || "").trim() || null;
  const userId = session.userId;
  const { date } = nowInPunchTZ();
  await prisma.timeEntry.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, obs, updatedBy: session.role },
    update: { obs, updatedBy: session.role },
  });
  revalidatePath("/me");
}

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

  // Digitar/editar horários é exclusivo do gerente (correções).
  // O funcionário registra pelo botão "Registrar agora" (horário do servidor, não editável).
  if (session.role !== "MANAGER") {
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
