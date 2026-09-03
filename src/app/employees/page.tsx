import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { SaldoPill } from "@/components/ui";
import { bancoTotalMin, scheduleOf, fmtDur, initials } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireManager();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: { entries: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header session={session} active="employees" />
      <main className="wrap grid" style={{ gap: 16 }}>
        <div className="row wrapf">
          <h2 style={{ fontSize: 18 }}>Funcionários</h2>
          <div className="spacer" />
          <Link href="/employees/new" className="btn primary">
            + Novo funcionário
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="card empty">
            Nenhum funcionário cadastrado.
            <div style={{ marginTop: 12 }}>
              <Link href="/employees/new" className="btn primary">
                + Novo funcionário
              </Link>
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
                      {!e.email && <span className="tag" style={{ color: "var(--warn)" }}>sem e-mail</span>}
                    </div>
                    <div className="muted small">
                      {(e.cargo ? e.cargo + " · " : "") + `@${e.username} · jornada ${sched.entrada}–${sched.saida} · ${fmtDur(sched.cargaMin)}/dia`}
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
