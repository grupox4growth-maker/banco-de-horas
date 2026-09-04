import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/time";
import type { Session } from "@/lib/auth";

const clock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export function Header({ session, active }: { session: Session; active?: string }) {
  const manager = session.role === "MANAGER";
  return (
    <header className="top">
      <div className="wrap hbar">
        <Link href={manager ? "/dashboard" : "/me"} className="brandmark">
          <span className="logo">{clock}</span>
          <span>Ponto &amp; Banco de Horas</span>
        </Link>
        <div className="spacer" />
        <div className="who">
          <span className="avatar">{initials(session.name)}</span>
          <span className="hide-sm">{manager ? "Gerente" : session.name}</span>
          <form action={logoutAction}>
            <button className="btn sm ghost" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
      {manager && (
        <div className="wrap">
          <nav className="tabs">
            <Link className={active === "dashboard" ? "active" : ""} href="/dashboard">
              Painel
            </Link>
            <Link className={active === "employees" ? "active" : ""} href="/employees">
              Funcionários
            </Link>
            <Link className={active === "produtividade" ? "active" : ""} href="/produtividade">
              Produtividade
            </Link>
            <Link className={active === "rotinas" ? "active" : ""} href="/rotinas">
              Rotinas
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
