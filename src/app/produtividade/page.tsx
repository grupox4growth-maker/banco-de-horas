import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { initials } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ProdutividadePage() {
  const session = await requireManager();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", active: true },
    include: { productivity: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header session={session} active="produtividade" />
      <main className="wrap grid" style={{ gap: 16 }}>
        <h2 style={{ fontSize: 18 }}>Banco de produtividade</h2>
        {employees.length === 0 ? (
          <div className="card empty">Sem funcionários ativos.</div>
        ) : (
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Lançamentos</th>
                    <th>Pontos totais</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => {
                    const total = e.productivity.reduce((a, p) => a + p.pontos, 0);
                    const cls = total > 0 ? "val-pos" : total < 0 ? "val-neg" : "val-zero";
                    return (
                      <tr key={e.id}>
                        <td>
                          <div className="row">
                            <span className="avatar">{initials(e.name)}</span>
                            <span style={{ fontWeight: 700 }}>{e.name}</span>
                          </div>
                        </td>
                        <td className="num">{e.productivity.length}</td>
                        <td>
                          <span className={"num " + cls} style={{ fontWeight: 800 }}>
                            {(total > 0 ? "+" : "") + total} pts
                          </span>
                        </td>
                        <td>
                          <Link href={`/employees/${e.id}`} className="btn sm">
                            Ver / lançar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="note">
          Use pontos positivos para reconhecer bom desempenho e negativos para pontos de atenção. Cada funcionário acompanha o próprio total na área dele.
        </div>
      </main>
    </>
  );
}
