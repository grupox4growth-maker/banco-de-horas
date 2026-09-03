import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { reset?: string };
}) {
  const session = await getSession();
  if (session) redirect(session.role === "MANAGER" ? "/dashboard" : "/me");

  // Primeiro uso: se ainda não há gerente, vai para a configuração inicial.
  const managerCount = await prisma.user.count({ where: { role: "MANAGER" } });
  if (managerCount === 0) redirect("/setup");

  return (
    <AuthShell title="Ponto & Banco de Horas" sub="Entre com seu usuário e senha.">
      <LoginForm resetDone={searchParams.reset === "1"} />
    </AuthShell>
  );
}
