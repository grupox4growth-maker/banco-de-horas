import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm } from "@/components/ActionForm";
import { selfRegisterAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function CadastroPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams.code || "";
  const setting = await prisma.setting.findUnique({ where: { id: "app" } });
  const valid = !!code && !!setting && code === setting.registrationCode;

  if (!valid) {
    return (
      <AuthShell title="Link inválido">
        <div className="banner err">
          Este link de cadastro não é válido ou expirou. Peça o link atualizado ao seu gerente.
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/login" className="btn block">
            Ir para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar meu acesso" sub="Preencha seus dados para começar a usar o ponto.">
      <ActionForm action={selfRegisterAction} submitLabel="Criar meu acesso" block>
        <input type="hidden" name="code" value={code} />
        <div className="field">
          <label htmlFor="name">Seu nome completo</label>
          <input id="name" name="name" placeholder="ex: Ana Souza" />
        </div>
        <div className="field">
          <label htmlFor="username">Usuário (login)</label>
          <input id="username" name="username" autoCapitalize="none" placeholder="ex: ana" />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail (para recuperar a senha)</label>
          <input id="email" name="email" type="email" placeholder="ana@email.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Crie uma senha</label>
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="mínimo 8 caracteres" />
        </div>
        <div className="field">
          <label htmlFor="password2">Confirme a senha</label>
          <input id="password2" name="password2" type="password" autoComplete="new-password" />
        </div>
      </ActionForm>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <Link href="/login" className="small muted">
          Já tenho acesso? Entrar
        </Link>
      </div>
    </AuthShell>
  );
}
