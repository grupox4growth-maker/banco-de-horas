import { SEGS, WD, computeDay, fmtDur, brDate, dowOf, type Schedule } from "@/lib/time";
import { punchNowAction, saveObservationAction } from "@/lib/actions/entries";
import { LiveClock } from "@/components/LiveClock";

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

export function PunchClock({
  entry,
  date,
  schedule,
}: {
  entry: Entry | null;
  date: string;
  schedule: Schedule;
}) {
  const calc = computeDay(entry ?? { date }, schedule);
  const clsFor = (v: number | null) => (v == null ? "" : v > 0 ? "val-pos" : v < 0 ? "val-neg" : "val-zero");

  return (
    <div className="card pad grid" style={{ gap: 14 }}>
      <div className="row wrapf">
        <h3 style={{ fontSize: 16 }}>Bater ponto — hoje</h3>
        <div className="spacer" />
        <div style={{ textAlign: "right" }}>
          <div className="k small muted" style={{ textTransform: "uppercase", fontWeight: 800 }}>
            Agora
          </div>
          <LiveClock />
        </div>
      </div>
      <div className="note time">
        {WD[dowOf(date)]}, {brDate(date)} — toque no botão na hora certa. O horário é registrado
        automaticamente pelo sistema e <strong>não pode ser alterado</strong> (só o gerente corrige).
      </div>

      <div className="punchgrid">
        {SEGS.map((seg) => {
          const val = entry ? ((entry as Record<string, string | null>)[seg.k] ?? null) : null;
          return (
            <div className="punch" key={seg.k}>
              <label>
                <span className="segbadge" style={{ background: seg.color }} />
                {seg.label}
              </label>
              {val ? (
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                  <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>
                    {val}
                  </div>
                  <div className="small" style={{ color: "var(--pos)", fontWeight: 700 }}>
                    ✓ registrado
                  </div>
                </div>
              ) : (
                <form action={punchNowAction}>
                  <input type="hidden" name="segment" value={seg.k} />
                  <button type="submit" className="btn primary block">
                    Registrar agora
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
        <div className="mini">
          <div className="k" style={{ fontSize: 11, color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 800 }}>
            Trabalhado
          </div>
          <div className="num" style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>
            {fmtDur(calc.trabalhado)}
          </div>
        </div>
        <div className="mini">
          <div className="k" style={{ fontSize: 11, color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 800 }}>
            Previsto
          </div>
          <div className="num" style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>
            {fmtDur(calc.previsto)}
          </div>
        </div>
        <div className="mini">
          <div className="k" style={{ fontSize: 11, color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 800 }}>
            Saldo do dia
          </div>
          <div className={"num " + clsFor(calc.saldo)} style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>
            {calc.saldo == null ? "—" : (calc.saldo > 0 ? "+" : "") + fmtDur(calc.saldo)}
          </div>
        </div>
      </div>

      <form action={saveObservationAction} className="field">
        <label htmlFor="obs">Observação do dia (opcional)</label>
        <textarea id="obs" name="obs" rows={2} defaultValue={entry?.obs || ""} placeholder="ex: cheguei atrasado por causa do transporte" />
        <button type="submit" className="btn ghost sm" style={{ justifySelf: "start" }}>
          Salvar observação
        </button>
      </form>
    </div>
  );
}
