import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { StatCard, SaldoPill } from "@/components/ui";
import { bancoTotalMin, computeDay, scheduleOf, fmtDur, todayISO, initials } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireManager();
  const today = todayISO();

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      entries: true,
      productivity: true,
      notes: { where: { lida: false } },
    },
    orderBy: { name: "asc" },
  });

  const ativos = employees.filter((e) => e.active);
  const rows = ativos.map((e) => {
    const sched = scheduleOf(e);
    const banco = bancoTotalMin(e.entries, sched);
    const today0 = e.entries.find((x) => x.date === today) || null;
    const saldoHoje = today0 ? computeDay(today0, sched).saldo : null;
    const prodTotal = e.productivity.reduce((a, p) => a + p.pontos, 0);
    return { e, sched, banco, today0, saldoHoje, prodTotal, avisos: e.notes.length };
  });

  const totalBanco = rows.reduce((a, r) => a + r.banco, 0);
  const devendo = rows.filter((r) => r.banco < 0).length;
  const credito = rows.filter((r) => r.banco > 0).length;

  return (
    <>
      <Header session={session} active="dashboard" />
      <main className="wrap grid" style={{ gap: 18 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <StatCard k="Funcionários ativos" v={String(ativos.length)} />
          <StatCard
            k="Saldo geral do banco"
            v={fmtDur(totalBanco, { sign: true })}
            cls={totalBanco > 0 ? "val-pos" : totalBanco < 0 ? "val-neg" : ""}
          />
          <StatCard k="Devendo horas" v={String(devendo)} cls={devendo ? "val-neg" : ""} />
          <StatCard k="Com horas a favor" v={String(credito)} cls={credito ? "val-pos" : ""} />
        </div>

        <div className="card">
          <div className="pad" style={{ paddingBottom: 6 }}>
            <div className="row wrapf">
              <h2 style={{ fontSize: 16 }}>Situação de cada funcionário</h2>
              <div className="spacer" />
              <Link href="/employees/new" className="btn primary sm">
                + Novo funcionário
              </Link>
            </div>
          </div>
          {rows.length === 0 ? (
            <div className="empty">
              Nenhum funcionário cadastrado.
              <div style={{ marginTop: 12 }}>
                <Link href="/employees/new" className="btn primary">
                  + Novo funcionário
                </Link>
              </div>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Ponto de hoje</th>
                    <th>Saldo hoje</th>
                    <th>Banco de horas</th>
                    <th>Produtividade</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ e, banco, today0, saldoHoje, prodTotal, avisos }) => (
                    <tr key={e.id}>
                      <td>
                        <Link href={`/employees/${e.id}`} className="row" style={{ color: "inherit" }}>
                          <span className="avatar">{initials(e.name)}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{e.name}</div>
                            <div className="muted small">{e.cargo || "—"}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="num">
                        {today0 && (today0.entrada || today0.saida)
                          ? `${today0.entrada || "—"} → ${today0.saida || "—"}`
                          : "—"}
                      </td>
                      <td>
                        <SaldoPill min={saldoHoje} />
                      </td>
                      <td>
                        <SaldoPill min={banco} />
                      </td>
                      <td className="num">{prodTotal} pts</td>
                      <td>{avisos > 0 && <span className="pill warn">{avisos} aviso{avisos > 1 ? "s" : ""}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
