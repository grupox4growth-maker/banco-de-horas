"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { nowInPunchTZ } from "@/lib/time";
import { parseBlocks, EXAMPLE_ROUTINE } from "@/lib/routines";
import type { FormState } from "@/lib/actions/auth";

async function assertManager() {
  const s = await getSession();
  if (!s || s.role !== "MANAGER") throw new Error("Não autorizado.");
  return s;
}

/* ---------------- CRIAR ROTINA ---------------- */
export async function createRoutineAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const name = String(f.get("name") || "").trim();
  const blocks = parseBlocks(String(f.get("blocks") || ""));
  if (!name) return { error: "Dê um nome para a rotina." };
  if (!blocks.length) return { error: "Adicione pelo menos um bloco (ex: 08:00-09:00 Prospecção)." };
  await prisma.routine.create({ data: { name, blocks } });
  revalidatePath("/rotinas");
  redirect("/rotinas");
}

/* ---------------- EDITAR ROTINA ---------------- */
export async function updateRoutineAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const id = String(f.get("id") || "");
  const name = String(f.get("name") || "").trim();
  const blocks = parseBlocks(String(f.get("blocks") || ""));
  if (!id) return { error: "Rotina inválida." };
  if (!name) return { error: "Dê um nome para a rotina." };
  if (!blocks.length) return { error: "Adicione pelo menos um bloco." };
  await prisma.routine.update({ where: { id }, data: { name, blocks } });
  revalidatePath("/rotinas");
  redirect("/rotinas");
}

/* ---------------- EXCLUIR ROTINA ---------------- */
export async function deleteRoutineAction(f: FormData): Promise<void> {
  await assertManager();
  const id = String(f.get("id") || "");
  if (id) {
    await prisma.routine.delete({ where: { id } });
    revalidatePath("/rotinas");
  }
  redirect("/rotinas");
}

/* ---------------- CRIAR ROTINA DE EXEMPLO ---------------- */
export async function createExampleRoutineAction(): Promise<void> {
  await assertManager();
  await prisma.routine.create({ data: { name: EXAMPLE_ROUTINE.name, blocks: EXAMPLE_ROUTINE.blocks } });
  revalidatePath("/rotinas");
}

/* ---------------- MARCAR / DESMARCAR BLOCO (funcionário) ---------------- */
export async function toggleCheckAction(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const blockKey = String(f.get("blockKey") || "");
  if (!blockKey) return;
  const userId = session.userId; // o funcionário só marca o próprio checklist
  const { date } = nowInPunchTZ();

  const existing = await prisma.routineCheck.findUnique({
    where: { userId_date_blockKey: { userId, date, blockKey } },
  });
  if (existing) {
    await prisma.routineCheck.delete({ where: { id: existing.id } });
  } else {
    await prisma.routineCheck.create({ data: { userId, date, blockKey } });
  }
  revalidatePath("/me");
  revalidatePath(`/employees/${userId}`);
  revalidatePath("/dashboard");
  revalidatePath("/produtividade");
}
