"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { saveEntryAction } from "@/lib/actions/entries";
import type { FormState } from "@/lib/actions/auth";
import {
  SEGS,
  WD,
  computeDay,
  fmtDur,
  addMinToHM,
  nowHM,
  dowOf,
  brDate,
  type Schedule,
  type SegKey,
} from "@/lib/time";

type Vals = Record<SegKey, string>;

const EMPTY: Vals = {
  entrada: "",
  saidaAlmoco: "",
  voltaAlmoco: "",
  intInicio: "",
  intFim: "",
  saida: "",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary" type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar ponto"}
    </button>
  );
}

export function PunchEditor({
  userId,
  date,
  schedule,
  initial,
  initialObs,
}: {
  userId: string;
  date: string;
  schedule: Schedule;
  initial: Partial<Vals>;
  initialObs: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [vals, setVals] = useState<Vals>({ ...EMPTY, ...initial });
  const [obs, setObs] = useState(initialObs);
  const [state, formAction] = useFormState<FormState, FormData>(saveEntryAction, {});

  const set = (k: SegKey, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const calc = computeDay({ date, ...vals }, schedule);
  const clsFor = (v: number | null) => (v == null ? "" : v > 0 ? "val-pos" : v < 0 ? "val-neg" : "val-zero");

  const changeDate = (d: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("date", d);
    router.push(`${pathname}?${q.toString()}`);
  };

  return (
    <div className="card pad grid" style={{ gap: 14 }}>
      <div className="row wrapf">
        <h3 style={{ fontSize: 16 }}>Registro de ponto</h3>
        <div className="spacer" />
        <input
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          style={{ maxWidth: 170 }}
        />
      </div>
      <div className="muted small">
        {WD[dowOf(date)]}, {brDate(date)}
      </div>

      <form action={formAction} className="grid" style={{ gap: 14 }}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="date" value={date} />
        <div className="punchgrid">
          {SEGS.map((seg) => (
            <div className="punch" key={seg.k}>
              <label>
                <span className="segbadge" style={{ background: seg.color }} />
                {seg.label}
              </label>
              <input
                type="time"
                name={seg.k}
                value={vals[seg.k]}
                onChange={(e) => set(seg.k, e.target.value)}
              />
              <button
                type="button"
                className="btn ghost sm"
                style={{ marginTop: 6, padding: "2px 8px", color: "var(--brand)", border: "none" }}
                onClick={() => set(seg.k, nowHM())}
              >
                Agora
              </button>
            </div>
          ))}
        </div>

        <div className="field">
          <label htmlFor="obs">Observação do dia</label>
          <textarea
            id="obs"
            name="obs"
            rows={2}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Opcional: atestado, falta justificada, hora extra combinada…"
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          <MiniStat k="Trabalhado" v={fmtDur(calc.trabalhado)} />
          <MiniStat k="Previsto" v={fmtDur(calc.previsto)} />
          <MiniStat
            k="Saldo do dia"
            v={calc.saldo == null ? "—" : (calc.saldo > 0 ? "+" : "") + fmtDur(calc.saldo)}
            cls={clsFor(calc.saldo)}
          />
        </div>

        {calc.atraso > 0 && (
          <div className="note warn">
            <div style={{ fontWeight: 800, marginBottom: 3 }}>
              Atraso de {fmtDur(calc.atraso)} na entrada
            </div>
            <div>
              Para compensar, o horário sugerido fica deslocado {fmtDur(calc.atraso)}:{" "}
              <span className="num" style={{ fontWeight: 700 }}>
                saída p/ almoço {addMinToHM(schedule.saidaAlmoco, calc.atraso)} · volta{" "}
                {addMinToHM(schedule.voltaAlmoco, calc.atraso)} · saída{" "}
                {addMinToHM(schedule.saida, calc.atraso)}
              </span>
            </div>
          </div>
        )}

        {state.error && <div className="banner err">{state.error}</div>}
        {state.ok && state.message && <div className="banner ok">{state.message} ✓</div>}
        <div>
          <Submit />
        </div>
      </form>
    </div>
  );
}

function MiniStat({ k, v, cls = "" }: { k: string; v: string; cls?: string }) {
  return (
    <div className="mini">
      <div className="k" style={{ fontSize: 11, color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 800 }}>
        {k}
      </div>
      <div className={"num " + cls} style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>
        {v}
      </div>
    </div>
  );
}
