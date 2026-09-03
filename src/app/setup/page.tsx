import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm } from "@/components/ActionForm";
import { createInitialManagerAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const managerCount = await prisma.user.count({ where: { role: "MANAGER" } });
  if (managerCount > 0) redirect("/login");

  return (
    <AuthShell title="Configuração inicial" sub="Crie a conta do gerente. É ela que controla todo o sistema.">
      <ActionForm action={createInitialManagerAction} submitLabel="Criar conta e entrar" block>
        <div className="field">
          <label htmlFor="name">Seu nome</label>
          <input id="name" name="name" placeholder="Nome do gerente" />
        </div>
        <div className="field">
          <label htmlFor="username">Usuário</label>
          <input id="username" name="username" autoCapitalize="none" placeholder="ex: gerente" />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail (para recuperar senha)</label>
          <input id="email" name="email" type="email" placeholder="gerente@empresa.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" placeholder="mínimo 8 caracteres" />
        </div>
        <div className="field">
          <label htmlFor="password2">Confirmar senha</label>
          <input id="password2" name="password2" type="password" />
        </div>
      </ActionForm>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <Link href="/login" className="small muted">
          Já tem conta? Entrar
        </Link>
      </div>
    </AuthShell>
  );
}
