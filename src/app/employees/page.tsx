import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { registerLink } from "@/lib/url";
import { Header } from "@/components/Header";
import { SaldoPill } from "@/components/ui";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { bancoTotalMin, scheduleOf, fmtDur, initials } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireManager();
  const [employees, setting] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { entries: true },
      orderBy: { name: "asc" },
    }),
    getSettings(),
  ]);
  const link = registerLink(setting.registrationCode);

  return (
    <>
      <Header session={session} active="employees" />
      <main className="wrap grid" style={{ gap: 16 }}>
        <h2 style={{ fontSize: 18 }}>Funcionários</h2>

        <InviteLinkCard link={link} />

        {employees.length === 0 ? (
          <div className="card empty">
            Nenhum funcionário cadastrado ainda.
            <div className="small" style={{ marginTop: 8 }}>
              Compartilhe o link de convite acima — quando alguém se cadastrar, aparece aqui.
            </div>
          </div>
        ) : (
          <div className="card pad">
            {employees.map((e) => {
              const sched = scheduleOf(e);
              const banco = bancoTotalMin(e.entries, sched);
              return (
                <div className="list-row" key={e.id}>
                  <span className="avatar">{initials(e.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>{e.name}</span>
                      {!e.active && <span className="tag">inativo</span>}
                    </div>
                    <div className="muted small">
                      {(e.cargo ? e.cargo + " · " : "") + `@${e.username ?? "—"} · jornada ${sched.entrada}–${sched.saida} · ${fmtDur(sched.cargaMin)}/dia`}
                    </div>
                  </div>
                  <SaldoPill min={banco} />
                  <Link href={`/employees/${e.id}`} className="btn sm">
                    Abrir
                  </Link>
                  <Link href={`/employees/${e.id}/edit`} className="btn sm ghost">
                    Editar
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
