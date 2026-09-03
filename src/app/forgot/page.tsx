import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm } from "@/components/ActionForm";
import { requestResetAction } from "@/lib/actions/auth";

export default function ForgotPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      sub="Informe seu e-mail. Se estiver cadastrado, você receberá um link para criar uma nova senha."
    >
      <ActionForm
        action={requestResetAction}
        submitLabel="Enviar link"
        block
        extra={
          <Link href="/login" className="btn ghost sm">
            Voltar ao login
          </Link>
        }
      >
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoCapitalize="none" placeholder="seu@email.com" />
        </div>
      </ActionForm>
    </AuthShell>
  );
}
