"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import type { FormState } from "@/lib/actions/auth";

async function assertManager() {
  const s = await getSession();
  if (!s || s.role !== "MANAGER") throw new Error("Não autorizado.");
  return s;
}

function parseSchedule(f: FormData) {
  const dias = f.getAll("dias").map((d) => Number(d)).filter((n) => !isNaN(n));
  const cargaHoras = parseFloat(String(f.get("cargaHoras") || "8"));
  return {
    entrada: String(f.get("entrada") || "08:00"),
    saidaAlmoco: String(f.get("saidaAlmoco") || "12:00"),
    voltaAlmoco: String(f.get("voltaAlmoco") || "13:00"),
    saida: String(f.get("saida") || "17:00"),
    cargaMin: Math.round((isNaN(cargaHoras) ? 8 : cargaHoras) * 60),
    descontarIntervalo: f.get("descontarIntervalo") === "on",
    dias: dias.length ? dias : [1, 2, 3, 4, 5],
  };
}

/* ---------------- CRIAR ---------------- */
export async function createEmployeeAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const name = String(f.get("name") || "").trim();
  const username = String(f.get("username") || "").trim().toLowerCase();
  const email = String(f.get("email") || "").trim().toLowerCase() || null;
  const cargo = String(f.get("cargo") || "").trim() || null;
  const password = String(f.get("password") || "");

  if (!name) return { error: "Informe o nome." };
  if (!username) return { error: "Defina um usuário (login)." };
  if (password.length < 8) return { error: "A senha inicial deve ter pelo menos 8 caracteres." };

  const sched = parseSchedule(f);
  try {
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        cargo,
        role: "EMPLOYEE",
        passwordHash: await hashPassword(password),
        ...sched,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const field = (e.meta?.target as string[])?.join(", ") || "usuário/e-mail";
      return { error: `Já existe um cadastro com este ${field}.` };
    }
    console.error(e);
    return { error: "Erro ao cadastrar. Tente novamente." };
  }
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  redirect("/employees");
}

/* ---------------- EDITAR ---------------- */
export async function updateEmployeeAction(_prev: FormState, f: FormData): Promise<FormState> {
  await assertManager();
  const id = String(f.get("id") || "");
  const name = String(f.get("name") || "").trim();
  const username = String(f.get("username") || "").trim().toLowerCase();
  const email = String(f.get("email") || "").trim().toLowerCase() || null;
  const cargo = String(f.get("cargo") || "").trim() || null;
  const active = f.get("active") === "on";
  if (!id) return { error: "Funcionário inválido." };
  if (!name) return { error: "Informe o nome." };
  if (!username) return { error: "Defina um usuário (login)." };

  const sched = parseSchedule(f);
  try {
    await prisma.user.update({
      where: { id },
      data: { name, username, email, cargo, active, ...sched },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const field = (e.meta?.target as string[])?.join(", ") || "usuário/e-mail";
      return { error: `Já existe um cadastro com este ${field}.` };
    }
    console.error(e);
    return { error: "Erro ao salvar. Tente novamente." };
  }
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

/* ---------------- REDEFINIR SENHA (gerente) ---------------- */
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
