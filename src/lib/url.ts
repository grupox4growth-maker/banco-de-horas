import "server-only";
import { headers } from "next/headers";

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Link público de autocadastro do funcionário. */
export function registerLink(code: string) {
  return `${appUrl()}/cadastro?code=${code}`;
}
