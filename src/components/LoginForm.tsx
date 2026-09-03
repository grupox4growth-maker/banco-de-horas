"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type FormState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary block" type="submit" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm({ resetDone }: { resetDone?: boolean }) {
  const [state, formAction] = useFormState<FormState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="grid" style={{ gap: 12 }}>
      {resetDone && <div className="banner ok">Senha redefinida! Entre com a nova senha.</div>}
      <div className="field">
        <label htmlFor="username">Usuário</label>
        <input id="username" name="username" autoCapitalize="none" autoComplete="username" placeholder="seu usuário" />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="sua senha" />
      </div>
      {state.error && <div className="banner err">{state.error}</div>}
      <Submit />
      <Link href="/forgot" className="btn ghost sm block">
        Esqueci minha senha
      </Link>
    </form>
  );
}
