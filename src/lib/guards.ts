import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth";

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireManager(): Promise<Session> {
  const s = await requireSession();
  if (s.role !== "MANAGER") redirect("/me");
  return s;
}
