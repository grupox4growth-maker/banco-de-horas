"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { regenerateRegistrationCode } from "@/lib/settings";
import type { FormState } from "@/lib/actions/auth";

async function assertManager() {
  const s = await getSession();
  if (!s || s.role !== "MANAGER") throw new Error("Não autorizado.");
  return s;
}

function parseSchedule(f: FormData) {
  const dias = f.getAll("dias").map((d) => Number(d)).filter((n) => !isNaN(n));
  const cargaHoras = parseFloat(String(f.get("cargaHoras") || "8"));
  const opt = (k: string) => {
    const v = String(f.get(k) || "").trim();
    return v || null;
  };
  return {
    entrada: String(f.get("entrada") || "08:00"),
    saidaAlmoco: String(f.get("saidaAlmoco") || "12:00"),
    voltaAlmoco: String(f.get("voltaAlmoco") || "13:00"),
    saida: String(f.get("saida") || "17:00"),
    intInicio: opt("intInicio"),
    intFim: opt("intFim"),
    cargaMin: Math.round((isNaN(cargaHoras) ? 8 : cargaHoras) * 60),
    descontarIntervalo: f.get("descontarIntervalo") === "on",
    dias: dias.length ? dias : [1, 2, 3, 4, 5],
  };
}

/* ---------------- GERAR NOVO LINK DE CONVITE (invalida o anterior) ---------------- */
export async function regenerateRegistrationCodeAction(): Promise<void> {
  await assertManager();
  await regenerateRegistrationCode();
  revalidatePath("/employees");
}

/* ---------------- EDITAR (gerente ajusta dados/jornada) ---------------- */
export async function updateEmployeeAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const id = String(f.get("id") || "");
  const name = String(f.get("name") || "").trim();
  const email = String(f.get("email") || "").trim().toLowerCase() || null;
  const cargo = String(f.get("cargo") || "").trim() || null;
  const active = f.get("active") === "on";
  const routineId = String(f.get("routineId") || "") || null;
  if (!id) return { error: "Funcionário inválido." };
  if (!name) return { error: "Informe o nome." };

  const sched = parseSchedule(f);
  try {
    await prisma.user.update({
      where: { id },
      data: { name, email, cargo, active, routineId, ...sched },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const field = (e.meta?.target as string[])?.join(", ") || "e-mail";
      return { error: `Já existe um cadastro com este ${field}.` };
    }
    console.error(e);
    return { error: "Erro ao salvar. Tente novamente." };
  }
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

/* ---------------- REDEFINIR SENHA (gerente, plano B) ---------------- */
export async function resetEmployeePasswordAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const id = String(f.get("id") || "");
  const password = String(f.get("password") || "");
  if (!id) return { error: "Funcionário inválido." };
  if (password.length < 8) return { error: "A senha deve ter pelo menos 8 caracteres." };
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  return { ok: true, message: "Senha redefinida. Informe ao funcionário." };
}

/* ---------------- EXCLUIR ---------------- */
export async function deleteEmployeeAction(f: FormData): Promise<void> {
  await assertManager();
  const id = String(f.get("id") || "");
  if (id) {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/employees");
    revalidatePath("/dashboard");
  }
  redirect("/employees");
}
