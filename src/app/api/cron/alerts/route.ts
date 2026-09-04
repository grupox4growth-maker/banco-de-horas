import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowInPunchTZ, toMin, dowOf, scheduleOf } from "@/lib/time";
import { dueAlerts, type AlertTimes } from "@/lib/alerts";
import { sendPush, pushReady } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const qs = new URL(req.url).searchParams.get("secret");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return qs === secret || bearer === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!pushReady()) return NextResponse.json({ error: "push nao configurado (falta VAPID_PRIVATE)" }, { status: 200 });

  const { date, time } = nowInPunchTZ();
  const nowMin = toMin(time) ?? 0;
  const dow = dowOf(date);

  const url = new URL(req.url);

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE", active: true, pushSubs: { some: {} } },
    include: { pushSubs: true, entries: { where: { date } } },
  });

  // ?test=1 → envia uma notificação de teste para todos os inscritos (ignora horário)
  if (url.searchParams.get("test") === "1") {
    const results: unknown[] = [];
    for (const u of users) {
      for (const sub of u.pushSubs) {
        const r = await sendPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title: "Ponto & Banco de Horas", body: `${u.name.split(" ")[0]}, teste de notificação ✅`, tag: "teste" },
        );
        results.push({ user: u.name, result: r });
        if (r === "gone") await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
    return NextResponse.json({ test: true, now: time, results });
  }

  // ?debug=1 → mostra o que o servidor calcula, sem enviar
  if (url.searchParams.get("debug") === "1") {
    const report = users.map((u) => {
      const s = scheduleOf(u);
      const e = u.entries[0];
      const entry: AlertTimes | null = e
        ? { entrada: e.entrada, saidaAlmoco: e.saidaAlmoco, voltaAlmoco: e.voltaAlmoco, intInicio: e.intInicio, intFim: e.intFim, saida: e.saida }
        : null;
      const workday = !(Array.isArray(u.dias) && u.dias.length && !u.dias.includes(dow));
      const due = dueAlerts(
        { entrada: s.entrada, saidaAlmoco: s.saidaAlmoco, voltaAlmoco: s.voltaAlmoco, intInicio: s.intInicio, intFim: s.intFim, saida: s.saida },
        entry,
        nowMin,
        u.name.split(" ")[0],
        date,
      );
      return {
        nome: u.name,
        subs: u.pushSubs.length,
        diaDeTrabalho: workday,
        jornada: { entrada: s.entrada, saidaAlmoco: s.saidaAlmoco, voltaAlmoco: s.voltaAlmoco, saida: s.saida },
        pontoHoje: entry,
        avisosDevidos: due.map((a) => a.key),
      };
    });
    return NextResponse.json({ debug: true, now: time, nowMin, date, dow, report });
  }

  let sent = 0;

  for (const u of users) {
    if (Array.isArray(u.dias) && u.dias.length && !u.dias.includes(dow)) continue;

    const s = scheduleOf(u);
    const sched: AlertTimes = {
      entrada: s.entrada,
      saidaAlmoco: s.saidaAlmoco,
      voltaAlmoco: s.voltaAlmoco,
      intInicio: s.intInicio,
      intFim: s.intFim,
      saida: s.saida,
    };
    const e = u.entries[0];
    const entry: AlertTimes | null = e
      ? {
          entrada: e.entrada,
          saidaAlmoco: e.saidaAlmoco,
          voltaAlmoco: e.voltaAlmoco,
          intInicio: e.intInicio,
          intFim: e.intFim,
          saida: e.saida,
        }
      : null;

    const firstName = u.name.split(" ")[0];
    const alerts = dueAlerts(sched, entry, nowMin, firstName, date);

    for (const a of alerts) {
      // dedup: só envia se ainda não registramos esta chave
      try {
        await prisma.sentAlert.create({ data: { userId: u.id, key: a.key } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
        continue;
      }
      for (const sub of u.pushSubs) {
        const r = await sendPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title: "Ponto & Banco de Horas", body: a.body, tag: a.key },
        );
        if (r === "ok") sent++;
        else if (r === "gone") {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }

  // limpa registros antigos
  await prisma.sentAlert
    .deleteMany({ where: { sentAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } } })
    .catch(() => {});

  return NextResponse.json({ ok: true, now: time, sent, users: users.length });
}
