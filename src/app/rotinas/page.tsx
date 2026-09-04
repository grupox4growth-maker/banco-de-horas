import Link from "next/link";
import { requireManager } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { RoutineForm } from "@/components/RoutineForm";
import { createExampleRoutineAction, deleteRoutineAction } from "@/lib/actions/routines";
import { asBlocks } from "@/lib/routines";

export const dynamic = "force-dynamic";

export default async function RotinasPage({ searchParams }: { searchParams: { edit?: string } }) {
  const session = await requireManager();
  const routines = await prisma.routine.findMany({ orderBy: { createdAt: "desc" } });
  const editing = searchParams.edit ? routines.find((r) => r.id === searchParams.edit) : null;

  return (
    <>
      <Header session={session} active="rotinas" />
      <main className="wrap grid" style={{ gap: 16 }}>
        <div className="row wrapf">
          <h2 style={{ fontSize: 18 }}>Rotinas</h2>
          <div className="spacer" />
          {routines.length === 0 && (
            <form action={createExampleRoutineAction}>
              <button className="btn" type="submit">
                + Criar rotina de exemplo (Time 8AM)
              </button>
            </form>
          )}
        </div>

        {editing ? (
          <div className="card pad">
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Editar rotina</h3>
            <RoutineForm routine={editing} />
          </div>
        ) : (
          <>
            {routines.length > 0 && (
              <div className="card pad grid" style={{ gap: 8 }}>
                {routines.map((r) => {
                  const blocks = asBlocks(r.blocks);
                  const work = blocks.filter((b) => !b.pausa).length;
                  return (
                    <div className="list-row" key={r.id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{r.name}</div>
                        <div className="muted small">
                          {blocks.length} blocos · {work} valem ponto
                        </div>
                      </div>
                      <Link href={`/rotinas?edit=${r.id}`} className="btn sm ghost">
                        Editar
                      </Link>
                      <form action={deleteRoutineAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn sm ghost danger" type="submit">
                          Excluir
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="card pad">
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>Nova rotina</h3>
              <RoutineForm />
            </div>
          </>
        )}

        <div className="note">
          Crie a rotina e depois atribua a cada funcionário em <Link href="/employees">Funcionários → Editar</Link>. O
          funcionário vê o checklist e marca o que fez — cada item marcado vale 1 ponto de produtividade.
        </div>
      </main>
    </>
  );
}
