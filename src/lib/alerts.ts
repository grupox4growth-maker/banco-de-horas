import { toMin } from "@/lib/time";

export type AlertTimes = {
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  intInicio: string | null;
  intFim: string | null;
  saida: string | null;
};

const SEG_ORDER = ["entrada", "saidaAlmoco", "voltaAlmoco", "intInicio", "intFim", "saida"] as const;
type Seg = (typeof SEG_ORDER)[number];

export const ALERT_LABEL: Record<Seg, string> = {
  entrada: "bater a entrada",
  saidaAlmoco: "sair para o almoço",
  voltaAlmoco: "voltar do almoço",
  intInicio: "sair para o intervalo",
  intFim: "voltar do intervalo",
  saida: "registrar a saída",
};

export type DueAlert = { key: string; body: string };

/**
 * Dado o horário previsto (sched), os pontos já batidos (entry) e o minuto atual,
 * retorna os avisos que devem disparar agora. O atraso na entrada desloca os demais.
 * A mesma lógica roda no navegador (app aberto) e no servidor (push com app fechado).
 */
export function dueAlerts(
  sched: AlertTimes,
  entry: AlertTimes | null,
  nowMin: number,
  firstName: string,
  dateISO: string,
): DueAlert[] {
  const out: DueAlert[] = [];
  const done = (s: Seg) => !!(entry && entry[s]);
  const entMin = toMin(entry?.entrada ?? null);
  const schedEnt = toMin(sched.entrada);
  const atraso = entMin != null && schedEnt != null && entMin > schedEnt ? entMin - schedEnt : 0;

  for (const seg of SEG_ORDER) {
    if (done(seg)) continue;
    const base = toMin(sched[seg]);
    if (base == null) continue;
    const target = seg === "entrada" ? base : base + atraso;
    const diff = target - nowMin;
    const label = ALERT_LABEL[seg];

    if (diff <= 10 && diff > 5) {
      out.push({ key: `${dateISO}:${seg}:pre10`, body: `${firstName}, em 10 minutos você precisa ${label}.` });
    } else if (diff <= 5 && diff > 0) {
      out.push({ key: `${dateISO}:${seg}:pre5`, body: `${firstName}, faltam ${diff} min para ${label}.` });
    } else if (diff <= 0) {
      const late = -diff;
      if (late > 30) continue; // para de lembrar depois de 30 min de atraso
      const bucket = Math.floor(late / 5);
      if (late === 0) {
        out.push({ key: `${dateISO}:${seg}:now`, body: `${firstName}, está na hora de ${label}!` });
      } else {
        out.push({ key: `${dateISO}:${seg}:late${bucket}`, body: `${firstName}, você está atrasado ${late} min para ${label}.` });
      }
    }
  }
  return out;
}
