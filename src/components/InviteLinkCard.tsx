"use client";

import { useState } from "react";
import { regenerateRegistrationCodeAction } from "@/lib/actions/employees";

export function InviteLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: seleciona o texto
      const el = document.getElementById("invite-link-input") as HTMLInputElement | null;
      el?.select();
    }
  }

  return (
    <div className="card pad grid" style={{ gap: 10 }}>
      <div className="row wrapf">
        <h3 style={{ fontSize: 16 }}>Link de convite dos funcionários</h3>
      </div>
      <div className="muted small">
        Envie este link para os funcionários. Cada um cria o próprio acesso (nome, usuário e senha) e aparece aqui na lista.
      </div>
      <div className="row wrapf" style={{ gap: 8 }}>
        <input id="invite-link-input" value={link} readOnly onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, minWidth: 220 }} />
        <button type="button" className="btn primary" onClick={copy}>
          {copied ? "Copiado ✓" : "Copiar link"}
        </button>
        <form action={regenerateRegistrationCodeAction}>
          <button type="submit" className="btn ghost" title="Gera um link novo e invalida o anterior">
            Gerar novo link
          </button>
        </form>
      </div>
    </div>
  );
}
