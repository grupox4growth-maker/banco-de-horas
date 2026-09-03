import { computeDay, fmtDur, brDate, type Schedule } from "@/lib/time";
import { deleteEntryAction } from "@/lib/actions/entries";
import { deleteProductivityAction } from "@/lib/actions/productivity";
import { deleteNoteAction, markNoteReadAction } from "@/lib/actions/notes";

export function SaldoPill({ min }: { min: number | null }) {
  if (min == null) return <span className="muted">—</span>;
  const c = min > 0 ? "pos" : min < 0 ? "neg" : "zero";
  return <span className={"pill " + c}>{(min > 0 ? "+" : "") + fmtDur(min)}</span>;
}

export function StatCard({ k, v, cls = "" }: { k: string; v: string; cls?: string }) {
  return (
    <div className="card stat">
      <div className="k">{k}</div>
      <div className={"v " + cls}>{v}</div>
    </div>
  );
}

type EntryRow = {
  date: string;
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  intInicio: string | null;
  intFim: string | null;
  saida: string | null;
  obs: string | null;
};

export function HistoryTable({
  entries,
  schedule,
  userId,
  canManage,
}: {
  entries: EntryRow[];
  schedule: Schedule;
  userId: string;
  canManage: boolean;
}) {
  if (!entries.length) return <div className="empty">Nenhum ponto registrado ainda.</div>;
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Entrada</th>
            <th>Almoço</th>
            <th>Intervalo</th>
            <th>Saída</th>
            <th>Trab.</th>
            <th>Saldo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((en) => {
            const c = computeDay(en, schedule);
            const alm = en.saidaAlmoco || en.voltaAlmoco ? `${en.saidaAlmoco || "—"}/${en.voltaAlmoco || "—"}` : "—";
            const itv = en.intInicio || en.intFim ? `${en.intInicio || "—"}/${en.intFim || "—"}` : "—";
            const cls = c.saldo == null ? "" : c.saldo > 0 ? "val-pos" : c.saldo < 0 ? "val-neg" : "val-zero";
            return (
              <tr key={en.date}>
                <td className="num">{brDate(en.date)}</td>
                <td className="num">{en.entrada || "—"}</td>
                <td className="num">{alm}</td>
                <td className="num">{itv}</td>
                <td className="num">{en.saida || "—"}</td>
                <td className="num">{fmtDur(c.trabalhado)}</td>
                <td>
                  {c.saldo == null ? (
                    <span className="muted">—</span>
                  ) : (
                    <span className={"num " + cls}>{(c.saldo > 0 ? "+" : "") + fmtDur(c.saldo)}</span>
                  )}
                </td>
                <td>
                  {en.obs ? (
                    <span className="tag" title={en.obs}>
                      obs
                    </span>
                  ) : c.atraso > 0 ? (
                    <span className="pill warn">atraso</span>
                  ) : null}
                  {canManage && (
                    <form action={deleteEntryAction} style={{ display: "inline", marginLeft: 6 }}>
                      <input type="hidden" name="userId" value={userId} />
                      <input type="hidden" name="date" value={en.date} />
                      <button className="btn ghost sm danger" type="submit" title="Limpar dia">
                        ×
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProdList({
  items,
  userId,
  canManage,
}: {
  items: { id: string; data: string; pontos: number; nota: string | null }[];
  userId: string;
  canManage: boolean;
}) {
  if (!items.length) return <div className="muted small">Nenhum lançamento de produtividade ainda.</div>;
  return (
    <>
      {items.map((it) => (
        <div className="list-row" key={it.id}>
          <span className={"pill " + (it.pontos > 0 ? "pos" : it.pontos < 0 ? "neg" : "zero")}>
            {(it.pontos > 0 ? "+" : "") + it.pontos} pts
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{it.nota || "(sem descrição)"}</div>
            <div className="muted small">{brDate(it.data)}</div>
          </div>
          {canManage && (
            <form action={deleteProductivityAction}>
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="userId" value={userId} />
              <button className="btn ghost sm" type="submit" title="Excluir">
                ×
              </button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}

export function NotesList({
  items,
  userId,
  canManage,
}: {
  items: { id: string; data: string; tipo: string; texto: string; autor: string | null; lida: boolean }[];
  userId: string;
  canManage: boolean;
}) {
  if (!items.length) return <div className="muted small">Nenhuma observação registrada.</div>;
  return (
    <>
      {items.map((n) => (
        <div className={"note" + (n.tipo === "aviso" ? " warn" : "")} key={n.id}>
          <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="tag">{n.tipo === "aviso" ? "Aviso" : "Observação"}</span>
                {!n.lida && <span className="pill warn" style={{ padding: "1px 7px" }}>novo</span>}
                <span className="muted small">
                  {brDate(n.data)} · {n.autor}
                </span>
              </div>
              <div style={{ marginTop: 5 }}>{n.texto}</div>
            </div>
            {canManage ? (
              <form action={deleteNoteAction}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="userId" value={userId} />
                <button className="btn ghost sm" type="submit">×</button>
              </form>
            ) : (
              !n.lida && (
                <form action={markNoteReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn ghost sm" type="submit">Marcar lido</button>
                </form>
              )
            )}
          </div>
        </div>
      ))}
    </>
  );
}
