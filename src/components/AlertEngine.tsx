"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";
import { dueAlerts } from "@/lib/alerts";

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sub),
  });
  return res.ok;
}

type Times = {
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  intInicio: string | null;
  intFim: string | null;
  saida: string | null;
};

const SEG_ORDER = ["entrada", "saidaAlmoco", "voltaAlmoco", "intInicio", "intFim", "saida"] as const;
type Seg = (typeof SEG_ORDER)[number];

const LABEL: Record<Seg, string> = {
  entrada: "bater a entrada",
  saidaAlmoco: "sair para o almoço",
  voltaAlmoco: "voltar do almoço",
  intInicio: "sair para o intervalo",
  intFim: "voltar do intervalo",
  saida: "registrar a saída",
};

function toMin(t?: string | null): number | null {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function brNowMin(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  let h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  if (h === 24) h = 0;
  return h * 60 + m;
}

export function AlertEngine({
  name,
  date,
  sched,
  entry,
  dias,
}: {
  name: string;
  date: string;
  sched: Times;
  entry: Times | null;
  dias: number[];
}) {
  const [activated, setActivated] = useState(false);
  const [notifOk, setNotifOk] = useState(false);
  const [pushOk, setPushOk] = useState(false);
  const [lastMsg, setLastMsg] = useState<string>("");
  const fired = useRef<Set<string>>(new Set());
  const audioRef = useRef<AudioContext | null>(null);
  const firstName = name.split(" ")[0];

  const storeKey = `bh_alerts_${date}`;

  // carrega alertas já disparados hoje (evita repetir ao recarregar)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) fired.current = new Set(JSON.parse(raw));
      setActivated(localStorage.getItem("bh_alerts_on") === "1");
    } catch {}
    if (typeof Notification !== "undefined") setNotifOk(Notification.permission === "granted");
  }, [storeKey]);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify([...fired.current]));
    } catch {}
  }, [storeKey]);

  // cria/retoma o canal de áudio (o navegador exige um gesto do usuário para liberar o som)
  const ensureAudio = useCallback((): AudioContext | null => {
    try {
      if (!audioRef.current) {
        const AC =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        audioRef.current = new AC();
      }
      if (audioRef.current.state === "suspended") audioRef.current.resume().catch(() => {});
      return audioRef.current;
    } catch {
      return null;
    }
  }, []);

  const beep = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const go = () => {
      try {
        const play = (freq: number, start: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          o.type = "sine";
          g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.35);
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + 0.36);
        };
        play(880, 0);
        play(1174, 0.28);
      } catch {}
    };
    if (ctx.state === "suspended") ctx.resume().then(go).catch(() => {});
    else go();
  }, [ensureAudio]);

  const fire = useCallback(
    (key: string, msg: string) => {
      if (fired.current.has(key)) return;
      fired.current.add(key);
      persist();
      setLastMsg(msg);
      beep();
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Ponto & Banco de Horas", { body: msg, tag: key });
        }
      } catch {}
    },
    [persist, beep],
  );

  const activate = useCallback(async () => {
    ensureAudio();
    let granted = false;
    try {
      if (typeof Notification !== "undefined") {
        const p = await Notification.requestPermission();
        granted = p === "granted";
        setNotifOk(granted);
      }
    } catch {}
    if (granted) {
      try {
        const ok = await subscribeToPush();
        setPushOk(ok);
      } catch {}
    }
    setActivated(true);
    try {
      localStorage.setItem("bh_alerts_on", "1");
    } catch {}
    beep();
    setLastMsg(`Alertas ativados, ${firstName}! Vou te avisar nos horários.`);
  }, [beep, firstName, ensureAudio]);

  // Ao reabrir com alertas já ativados, re-registra a inscrição de push (mantém atualizada).
  useEffect(() => {
    if (!activated) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    subscribeToPush()
      .then((ok) => setPushOk(ok))
      .catch(() => {});
  }, [activated]);

  // Após recarregar/instalar, o áudio começa "travado" — religa no primeiro toque/clique.
  useEffect(() => {
    if (!activated) return;
    const unlock = () => ensureAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [activated, ensureAudio]);

  // motor de verificação
  useEffect(() => {
    if (!activated) return;
    const tick = () => {
      const dow = new Date(date + "T12:00:00").getDay();
      if (Array.isArray(dias) && dias.length && !dias.includes(dow)) return;
      const now = brNowMin();
      for (const a of dueAlerts(sched, entry, now, firstName, date)) fire(a.key, a.body);
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [activated, date, dias, sched, entry, fire, firstName]);

  if (!activated) {
    return (
      <div className="card pad row wrapf" style={{ gap: 10, borderLeft: "3px solid var(--accent)" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700 }}>🔔 Ativar alertas de ponto</div>
          <div className="muted small">
            Receba aviso com som na hora de sair/voltar do almoço e do intervalo (ajustado pelo seu atraso). Deixe o app aberto.
          </div>
        </div>
        <button className="btn primary" type="button" onClick={activate}>
          Ativar alertas
        </button>
      </div>
    );
  }

  return (
    <div className="card pad grid" style={{ gap: 8, borderLeft: "3px solid var(--pos)" }}>
      <div className="row wrapf" style={{ gap: 8 }}>
        <span style={{ fontWeight: 700 }}>🔔 Alertas ativados</span>
        {pushOk ? (
          <span className="tag" style={{ color: "var(--pos)" }}>
            avisa mesmo com o app fechado
          </span>
        ) : notifOk ? (
          <span className="tag">só com o app aberto</span>
        ) : (
          <span className="tag" style={{ color: "var(--warn)" }}>
            só com som (notificação bloqueada)
          </span>
        )}
        <div className="spacer" />
        <button
          className="btn ghost sm"
          type="button"
          onClick={() => {
            beep();
            setLastMsg(`${firstName}, este é um teste de alerta. 🔔`);
            try {
              if (typeof Notification !== "undefined" && Notification.permission === "granted")
                new Notification("Ponto & Banco de Horas", { body: `${firstName}, teste de alerta 🔔` });
            } catch {}
          }}
        >
          Testar
        </button>
      </div>
      {lastMsg && <div className="note time">{lastMsg}</div>}
    </div>
  );
}
