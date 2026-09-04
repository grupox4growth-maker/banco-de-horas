import "server-only";
import webpush from "web-push";
import { VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "@/lib/vapid";

let configured = false;

export function pushReady(): boolean {
  if (configured) return true;
  const priv = process.env.VAPID_PRIVATE;
  if (!priv) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, priv);
  configured = true;
  return true;
}

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Envia uma notificação. Retorna "gone" se a inscrição expirou (deve ser removida). */
export async function sendPush(
  sub: PushSub,
  payload: { title: string; body: string; tag?: string },
): Promise<"ok" | "gone" | "error"> {
  if (!pushReady()) return "error";
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return "ok";
  } catch (e: unknown) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) return "gone";
    console.error("[push] erro ao enviar:", code);
    return "error";
  }
}
