import "server-only";
import { Resend } from "resend";

const from = process.env.EMAIL_FROM || "Ponto <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, link: string, nome: string) {
  const key = process.env.RESEND_API_KEY;
  // Sem chave configurada: não quebra o fluxo; apenas registra no log do servidor.
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente. Link de redefinição (envie manualmente):", link);
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:auto;color:#1b2733">
    <h2 style="color:#125e57">Redefinir sua senha</h2>
    <p>Olá${nome ? ", " + escapeHtml(nome) : ""}. Recebemos um pedido para redefinir a senha do seu acesso ao Ponto &amp; Banco de Horas.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#125e57;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">
        Criar nova senha
      </a>
    </p>
    <p style="font-size:13px;color:#556170">Este link vale por 1 hora e só pode ser usado uma vez. Se você não pediu isso, ignore este e-mail.</p>
    <p style="font-size:12px;color:#8a97a6;word-break:break-all">Se o botão não funcionar, copie e cole: ${link}</p>
  </div>`;
  await resend.emails.send({
    from,
    to,
    subject: "Redefinir sua senha — Ponto & Banco de Horas",
    html,
  });
  return { skipped: false as const };
}

export async function sendInviteEmail(to: string, link: string, nome: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente. Link de convite (envie manualmente):", link);
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:auto;color:#1b2733">
    <h2 style="color:#125e57">Bem-vindo(a) ao Ponto &amp; Banco de Horas</h2>
    <p>Olá${nome ? ", " + escapeHtml(nome) : ""}! Seu acesso foi criado. Clique no botão abaixo para <strong>definir sua senha</strong> e começar a usar.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#125e57;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block">
        Criar minha senha
      </a>
    </p>
    <p style="font-size:12px;color:#8a97a6;word-break:break-all">Se o botão não funcionar, copie e cole: ${link}</p>
  </div>`;
  await resend.emails.send({
    from,
    to,
    subject: "Seu acesso ao Ponto & Banco de Horas",
    html,
  });
  return { skipped: false as const };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
