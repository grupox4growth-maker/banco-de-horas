import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { EmployeeForm } from "@/components/EmployeeForm";
import { ActionForm } from "@/components/ActionForm";
import { resetEmployeePasswordAction, deleteEmployeeAction } from "@/lib/actions/employees";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const session = await requireManager();
  const [employee, routines] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.id } }),
    prisma.routine.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!employee || employee.role !== "EMPLOYEE") notFound();

  return (
    <>
      <Header session={session} active="employees" />
      <main className="wrap grid" style={{ gap: 16, maxWidth: 720 }}>
        <div className="row">
          <Link href={`/employees/${employee.id}`} className="btn ghost sm">
            ‹ Voltar
          </Link>
        </div>
        <h2 style={{ fontSize: 20 }}>Editar funcionário</h2>

        <div className="card pad">
          <EmployeeForm employee={employee} routines={routines} />
        </div>

        <div className="card pad grid" style={{ gap: 10 }}>
          <h3 style={{ fontSize: 16 }}>Redefinir senha</h3>
          <div className="muted small">Defina uma nova senha e informe ao funcionário. Ele pode trocá-la depois.</div>
          <ActionForm action={resetEmployeePasswordAction} submitLabel="Redefinir senha">
            <input type="hidden" name="id" value={employee.id} />
            <div className="field">
              <label htmlFor="password">Nova senha</label>
              <input id="password" name="password" type="password" placeholder="mínimo 8 caracteres" />
            </div>
          </ActionForm>
        </div>

        <div className="card pad grid" style={{ gap: 10 }}>
          <h3 style={{ fontSize: 16 }}>Excluir funcionário</h3>
          <div className="muted small">
            Remove o funcionário e todos os registros dele (ponto, produtividade, avisos). Esta ação não pode ser desfeita.
          </div>
          <form action={deleteEmployeeAction}>
            <input type="hidden" name="id" value={employee.id} />
            <button className="btn danger" type="submit">
              Excluir {employee.name}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
