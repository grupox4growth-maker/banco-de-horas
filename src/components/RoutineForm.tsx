import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { createRoutineAction, updateRoutineAction } from "@/lib/actions/routines";
import { blocksToText, asBlocks } from "@/lib/routines";

export function RoutineForm({ routine }: { routine?: { id: string; name: string; blocks: unknown } }) {
  const editing = !!routine;
  const text = routine ? blocksToText(asBlocks(routine.blocks)) : "";

  return (
    <ActionForm
      action={editing ? updateRoutineAction : createRoutineAction}
      submitLabel={editing ? "Salvar rotina" : "Criar rotina"}
      extra={
        editing ? (
          <Link href="/rotinas" className="btn ghost">
            Cancelar
          </Link>
        ) : undefined
      }
    >
      {editing && <input type="hidden" name="id" value={routine!.id} />}
      <div className="field">
        <label htmlFor="name">Nome da rotina</label>
        <input id="name" name="name" defaultValue={routine?.name || ""} placeholder="ex: Time 8AM" />
      </div>
      <div className="field">
        <label htmlFor="blocks">Blocos (um por linha)</label>
        <textarea
          id="blocks"
          name="blocks"
          rows={12}
          defaultValue={text}
          placeholder={"08:00-09:00 Bloco 4: Confirmação + Follow-up\n09:00-09:30 Bloco 1: Kickstart + Review\n11:30-12:50 Almoço"}
          style={{ fontFamily: "var(--mono)" }}
        />
        <div className="muted small">
          Formato de cada linha: <strong>HH:MM-HH:MM Título</strong>. Blocos com &quot;Almoço&quot;, &quot;Pausa&quot; ou
          &quot;Intervalo&quot; no título entram como descanso (aparecem no checklist mas não valem ponto).
        </div>
      </div>
    </ActionForm>
  );
}
