// Cálculos de ponto e banco de horas. Sem dependências — usado no servidor e no cliente.

export const SEGS = [
  { k: "entrada", label: "Entrada", color: "#1f7a52" },
  { k: "saidaAlmoco", label: "Saída almoço", color: "#c96f2b" },
  { k: "voltaAlmoco", label: "Volta almoço", color: "#c96f2b" },
  { k: "intInicio", label: "Início intervalo", color: "#7b61b5" },
  { k: "intFim", label: "Fim intervalo", color: "#7b61b5" },
  { k: "saida", label: "Saída", color: "#b4372c" },
] as const;

export type SegKey = (typeof SEGS)[number]["k"];
export const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface Schedule {
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  saida: string | null;
  cargaMin: number;
  descontarIntervalo: boolean;
  dias: number[];
}

export interface EntryLike {
  date: string;
  entrada?: string | null;
  saidaAlmoco?: string | null;
  voltaAlmoco?: string | null;
  intInicio?: string | null;
  intFim?: string | null;
  saida?: string | null;
}

export function toMin(t?: string | null): number | null {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function dowOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function brDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function jornadaPrevistaMin(sched: Schedule, iso?: string): number {
  if (iso && Array.isArray(sched.dias) && !sched.dias.includes(dowOf(iso))) return 0;
  return sched.cargaMin ?? 480;
}

export interface DayResult {
  trabalhado: number | null;
  previsto: number;
  saldo: number | null;
  almoco: number | null;
  intervalo: number | null;
  atraso: number;
}

export function computeDay(entry: EntryLike, sched: Schedule): DayResult {
  const ent = toMin(entry.entrada);
  const sa = toMin(entry.saidaAlmoco);
  const va = toMin(entry.voltaAlmoco);
  const ii = toMin(entry.intInicio);
  const iff = toMin(entry.intFim);
  const sai = toMin(entry.saida);

  let trabalhado: number | null = null;
  let almoco: number | null = null;
  let intervalo: number | null = null;

  if (ent != null && sai != null) {
    let t = sai - ent;
    if (sa != null && va != null && va >= sa) {
      almoco = va - sa;
      t -= almoco;
    }
    if (ii != null && iff != null && iff >= ii) {
      intervalo = iff - ii;
      if (sched.descontarIntervalo) t -= intervalo;
    }
    trabalhado = Math.max(0, t);
  }

  const previsto = jornadaPrevistaMin(sched, entry.date);
  const saldo = trabalhado == null ? null : trabalhado - previsto;

  const entPrev = toMin(sched.entrada);
  const atraso = ent != null && entPrev != null && ent > entPrev ? ent - entPrev : 0;

  return { trabalhado, previsto, saldo, almoco, intervalo, atraso };
}

export function bancoTotalMin(entries: EntryLike[], sched: Schedule): number {
  return entries.reduce((acc, e) => acc + (computeDay(e, sched).saldo ?? 0), 0);
}

export function fmtDur(min: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (min == null || isNaN(min)) return "—";
  const s = min < 0 ? "-" : opts.sign ? "+" : "";
  const a = Math.abs(Math.round(min));
  const h = Math.floor(a / 60);
  const m = a % 60;
  if (a === 0) return "0h";
  const core = h > 0 ? (m > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${h}h`) : `${m}min`;
  return s + core;
}

export function addMinToHM(hm: string | null, min: number): string {
  const b = toMin(hm);
  if (b == null) return hm ?? "";
  let t = b + min;
  t = ((t % 1440) + 1440) % 1440;
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

export function nowHM(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Fuso oficial usado para bater ponto (hora do servidor, não do dispositivo do funcionário).
export const PUNCH_TZ = "America/Sao_Paulo";

/** Data (YYYY-MM-DD) e hora (HH:MM) atuais no fuso do Brasil — calculadas no servidor. */
export function nowInPunchTZ(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PUNCH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  let hh = g("hour");
  if (hh === "24") hh = "00";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${hh}:${g("minute")}` };
}

export function initials(name: string): string {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function scheduleOf(u: Partial<Schedule>): Schedule {
  return {
    entrada: u.entrada ?? "08:00",
    saidaAlmoco: u.saidaAlmoco ?? "12:00",
    voltaAlmoco: u.voltaAlmoco ?? "13:00",
    saida: u.saida ?? "17:00",
    cargaMin: u.cargaMin ?? 480,
    descontarIntervalo: u.descontarIntervalo ?? false,
    dias: u.dias ?? [1, 2, 3, 4, 5],
  };
}
