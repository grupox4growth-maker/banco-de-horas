import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { Header } from "@/components/Header";
import { EmployeeForm } from "@/components/EmployeeForm";

export default async function NewEmployeePage() {
  const session = await requireManager();
  return (
    <>
      <Header session={session} active="employees" />
      <main className="wrap grid" style={{ gap: 16, maxWidth: 720 }}>
        <div className="row">
          <Link href="/employees" className="btn ghost sm">
            ‹ Voltar
          </Link>
        </div>
        <h2 style={{ fontSize: 20 }}>Novo funcionário</h2>
        <div className="card pad">
          <EmployeeForm />
        </div>
      </main>
    </>
  );
}
