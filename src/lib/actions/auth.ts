"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export type FormState = { error?: string; ok?: boolean; message?: string };

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/* ---------------- LOGIN ---------------- */
export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!username || !password) return { error: "Preencha usuário e senha." };

  const user = await prisma.user.findUnique({ where: { username } });
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!user || !ok) return { error: "Usuário ou senha incorretos." };

  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect(user.role === "MANAGER" ? "/dashboard" : "/me");
}

/* ---------------- LOGOUT ---------------- */
export async function logoutAction(): Promise<void> {
  destroySession();
  redirect("/login");
}

/* ---------------- PRIMEIRO ACESSO: cria a conta do gerente ---------------- */
export async function createInitialManagerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const count = await prisma.user.count({ where: { role: "MANAGER" } });
  if (count > 0) return { error: "O sistema já foi configurado. Faça login." };

  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;
  const pw = String(formData.get("password") || "");
  const pw2 = String(formData.get("password2") || "");
  if (!name) return { error: "Informe seu nome." };
  if (!username) return { error: "Escolha um usuário." };
  if (pw.length < 8) return { error: "A senha deve ter pelo menos 8 caracteres." };
  if (pw !== pw2) return { error: "As senhas não conferem." };

  let user;
  try {
    user = await prisma.user.create({
      data: { name, username, email, role: "MANAGER", passwordHash: await hashPassword(pw) },
    });
  } catch {
    return { error: "Não foi possível criar a conta (usuário ou e-mail já em uso)." };
  }
  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect("/dashboard");
}

/* ---------------- ESQUECI MINHA SENHA ---------------- */
export async function requestResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  // Resposta sempre igual, para não revelar quais e-mails existem.
  const genericOk: FormState = {
    ok: true,
    message: "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
  };
  if (!email) return { error: "Informe seu e-mail." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return genericOk;

  // Invalida tokens antigos não usados deste usuário.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
    },
  });

  const link = `${appUrl()}/reset?token=${token}`;
  try {
    await sendPasswordResetEmail(user.email!, link, user.name);
  } catch (e) {
    console.error("[reset] falha ao enviar e-mail:", e);
  }
  return genericOk;
}

/* ---------------- REDEFINIR SENHA (via token) ---------------- */
export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const pw = String(formData.get("password") || "");
  const pw2 = String(formData.get("password2") || "");
  if (!token) return { error: "Link inválido." };
  if (pw.length < 8) return { error: "A senha deve ter pelo menos 8 caracteres." };
  if (pw !== pw2) return { error: "As senhas não conferem." };

  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return { error: "Este link é inválido ou expirou. Peça um novo." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(pw) } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}

/* ---------------- TROCAR A PRÓPRIA SENHA ---------------- */
export async function changeOwnPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };

  const cur = String(formData.get("current") || "");
  const pw = String(formData.get("password") || "");
  const pw2 = String(formData.get("password2") || "");
  if (pw.length < 8) return { error: "A nova senha deve ter pelo menos 8 caracteres." };
  if (pw !== pw2) return { error: "As senhas não conferem." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(cur, user.passwordHash))) {
    return { error: "Senha atual incorreta." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw) } });
  return { ok: true, message: "Senha alterada com sucesso." };
}
