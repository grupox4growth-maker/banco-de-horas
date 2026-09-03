import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm } from "@/components/ActionForm";
import { resetPasswordAction } from "@/lib/actions/auth";

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token || "";
  if (!token) {
    return (
      <AuthShell title="Link inválido">
        <div className="banner err">Este link de redefinição não é válido.</div>
        <div style={{ marginTop: 12 }}>
          <Link href="/forgot" className="btn block">
            Pedir um novo link
          </Link>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Criar nova senha" sub="Escolha uma nova senha para sua conta.">
      <ActionForm action={resetPasswordAction} submitLabel="Redefinir senha" block>
        <input type="hidden" name="token" value={token} />
        <div className="field">
          <label htmlFor="password">Nova senha</label>
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="mínimo 8 caracteres" />
        </div>
        <div className="field">
          <label htmlFor="password2">Confirmar nova senha</label>
          <input id="password2" name="password2" type="password" autoComplete="new-password" />
        </div>
      </ActionForm>
    </AuthShell>
  );
}
