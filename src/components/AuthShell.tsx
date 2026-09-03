import type { ReactNode } from "react";

const clock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <main className="narrow">
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <span className="logo" style={{ width: 46, height: 46, borderRadius: 13, margin: "0 auto 12px" }}>
          {clock}
        </span>
        <h1 style={{ fontSize: 23 }}>{title}</h1>
        {sub && <p className="muted" style={{ marginTop: 6 }}>{sub}</p>}
      </div>
      <div className="card pad">{children}</div>
    </main>
  );
}
