import Link from "next/link";
import { PunchEditor } from "@/components/PunchEditor";
import { PunchClock } from "@/components/PunchClock";
import { ActionForm } from "@/components/ActionForm";
import { HistoryTable, ProdList, NotesList } from "@/components/ui";
import { addProductivityAction } from "@/lib/actions/productivity";
import { addNoteAction } from "@/lib/actions/notes";
import { changeOwnPasswordAction } from "@/lib/actions/auth";
import { bancoTotalMin, scheduleOf, fmtDur, initials, todayISO, nowInPunchTZ } from "@/lib/time";

type Entry = {
  date: string;
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  intInicio: string | null;
  intFim: string | null;
  saida: string | null;
  obs: string | null;
};
type Emp = {
  id: string;
  name: string;
  username: string;
  cargo: string | null;
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  saida: string | null;
  cargaMin: number;
  descontarIntervalo: boolean;
  dias: number[];
  entries: Entry[];
  productivity: { id: string; data: string; pontos: number; nota: string | null }[];
  notes: { id: string; data: string; tipo: string; texto: string; autor: string | null; lida: boolean }[];
};

export function EmployeePanel({
  employee,
  canManage,
  date,
}: {
  employee: Emp;
  canManage: boolean;
  date: string;
}) {
  const sched = scheduleOf(employee);
  const banco = bancoTotalMin(employee.entries, sched);
  const prodTotal = employee.productivity.reduce((a, p) => a + p.pontos, 0);
  const entry = employee.entries.find((e) => e.date === date) || null;
  const unread = employee.notes.filter((n) => !n.lida);
  const today = todayISO();

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* Cabeçalho */}
      <div className="card pad row wrapf" style={{ gap: 14 }}>
        <span className="avatar lg">{initials(employee.name)}</span>
        <div style={{ flex: 1, minWidth: 140 }}>
          <h2 style={{ fontSize: 20 }}>{employee.name}</h2>
          <div className="muted small">
            {(employee.cargo ? employee.cargo + " · " : "") + `jornada ${sched.entrada}–${sched.saida}, ${fmtDur(sched.cargaMin)}/dia`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="k" style={{ fontSize: 11, textTransform: "uppercase", color: "var(--ink-2)", fontWeight: 800 }}>
            Banco de horas
          </div>
          <div
            className="num"
            style={{ fontSize: 22, fontWeight: 800, color: banco > 0 ? "var(--pos)" : banco < 0 ? "var(--neg)" : undefined }}
          >
            {(banco > 0 ? "+" : "") + fmtDur(banco)}
          </div>
        </div>
        {canManage && (
          <Link href={`/employees/${employee.id}/edit`} className="btn sm ghost">
            Editar
          </Link>
        )}
      </div>

      {/* Avisos não lidos (para o próprio funcionário) */}
      {!canManage && unread.length > 0 && (
        <div className="grid" style={{ gap: 8 }}>
          <NotesList items={unread} userId={employee.id} canManage={false} />
        </div>
      )}

      {/* Registro de ponto */}
      {canManage ? (
        <PunchEditor
          userId={employee.id}
          date={date}
          schedule={sched}
          initial={{
            entrada: entry?.entrada || "",
            saidaAlmoco: entry?.saidaAlmoco || "",
            voltaAlmoco: entry?.voltaAlmoco || "",
            intInicio: entry?.intInicio || "",
            intFim: entry?.intFim || "",
            saida: entry?.saida || "",
          }}
          initialObs={entry?.obs || ""}
        />
      ) : (
        (() => {
          const todayBR = nowInPunchTZ().date;
          const todayEntry = employee.entries.find((e) => e.date === todayBR) || null;
          return <PunchClock entry={todayEntry} date={todayBR} schedule={sched} />;
        })()
      )}

      {/* Histórico */}
      <div className="card">
        <div className="pad" style={{ paddingBottom: 4 }}>
          <h3 style={{ fontSize: 16 }}>Histórico de pontos</h3>
        </div>
        <HistoryTable entries={employee.entries} schedule={sched} userId={employee.id} canManage={canManage} />
      </div>

      {/* Produtividade */}
      <div className="card pad grid" style={{ gap: 12 }}>
        <div className="row">
          <h3 style={{ fontSize: 16 }}>Produtividade</h3>
          <div className="spacer" />
          <span
            className={"num " + (prodTotal > 0 ? "val-pos" : prodTotal < 0 ? "val-neg" : "val-zero")}
            style={{ fontWeight: 800, fontSize: 17 }}
          >
            {(prodTotal > 0 ? "+" : "") + prodTotal} pts
          </span>
        </div>
        <ProdList items={employee.productivity} userId={employee.id} canManage={canManage} />
        {canManage && (
          <div className="note" style={{ background: "transparent", borderLeftColor: "var(--pos)" }}>
            <ActionForm action={addProductivityAction} submitLabel="+ Lançar">
              <input type="hidden" name="userId" value={employee.id} />
              <div className="cols-3">
                <div className="field">
                  <label>Data</label>
                  <input name="data" type="date" defaultValue={today} />
                </div>
                <div className="field">
                  <label>Pontos (use - para descontar)</label>
                  <input name="pontos" type="number" step="1" defaultValue="5" />
                </div>
                <div className="field">
                  <label>Descrição</label>
                  <input name="nota" placeholder="ex: bateu a meta" />
                </div>
              </div>
            </ActionForm>
          </div>
        )}
      </div>

      {/* Observações / avisos */}
      <div className="card pad grid" style={{ gap: 12 }}>
        <h3 style={{ fontSize: 16 }}>Observações e avisos</h3>
        <NotesList items={employee.notes} userId={employee.id} canManage={canManage} />
        {canManage && (
          <div className="note" style={{ background: "transparent" }}>
            <ActionForm action={addNoteAction} submitLabel="Enviar aviso">
              <input type="hidden" name="userId" value={employee.id} />
              <div className="cols-3">
                <div className="field">
                  <label>Tipo</label>
                  <select name="tipo" defaultValue="obs">
                    <option value="obs">Observação</option>
                    <option value="aviso">Aviso (destaque)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Data</label>
                  <input name="data" type="date" defaultValue={today} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Mensagem</label>
                  <textarea name="texto" rows={2} placeholder="ex: combinar reposição das horas de sexta" />
                </div>
              </div>
            </ActionForm>
          </div>
        )}
      </div>

      {/* Minha conta (apenas o próprio funcionário) */}
      {!canManage && (
        <div className="card pad grid" style={{ gap: 10 }}>
          <h3 style={{ fontSize: 16 }}>Minha conta</h3>
          <div className="muted small">Usuário: <strong>@{employee.username}</strong></div>
          <ActionForm action={changeOwnPasswordAction} submitLabel="Trocar senha">
            <div className="cols-3">
              <div className="field">
                <label>Senha atual</label>
                <input name="current" type="password" autoComplete="current-password" />
              </div>
              <div className="field">
                <label>Nova senha</label>
                <input name="password" type="password" autoComplete="new-password" placeholder="mín. 8" />
              </div>
              <div className="field">
                <label>Confirmar nova senha</label>
                <input name="password2" type="password" autoComplete="new-password" />
              </div>
            </div>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
