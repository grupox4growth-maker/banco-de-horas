import { toggleCheckAction } from "@/lib/actions/routines";
import type { Block } from "@/lib/routines";

export function RoutineChecklist({
  routineName,
  blocks,
  checkedKeys,
  canToggle,
}: {
  routineName: string;
  blocks: Block[];
  checkedKeys: string[];
  canToggle: boolean;
}) {
  const checked = new Set(checkedKeys);
  const workBlocks = blocks.filter((b) => !b.pausa);
  const doneCount = workBlocks.filter((b) => checked.has(b.inicio)).length;

  return (
    <div className="card pad grid" style={{ gap: 10 }}>
      <div className="row wrapf">
        <h3 style={{ fontSize: 16 }}>Rotina — {routineName}</h3>
        <div className="spacer" />
        <span className="pill pos">
          {doneCount}/{workBlocks.length} feitos hoje
        </span>
      </div>

      <div className="grid" style={{ gap: 6 }}>
        {blocks.map((b) => {
          const isChecked = checked.has(b.inicio);
          if (b.pausa) {
            return (
              <div className="list-row" key={b.inicio} style={{ opacity: 0.6 }}>
                <span className="num small muted" style={{ width: 100 }}>
                  {b.inicio}–{b.termino}
                </span>
                <span className="muted" style={{ flex: 1 }}>
                  {b.titulo}
                </span>
                <span className="tag">pausa</span>
              </div>
            );
          }
          return (
            <div className="list-row" key={b.inicio}>
              <span className="num small" style={{ width: 100 }}>
                {b.inicio}–{b.termino}
              </span>
              <span
                style={{
                  flex: 1,
                  fontWeight: 600,
                  textDecoration: isChecked ? "line-through" : "none",
                  color: isChecked ? "var(--ink-2)" : "var(--ink)",
                }}
              >
                {b.titulo}
              </span>
              {canToggle ? (
                <form action={toggleCheckAction}>
                  <input type="hidden" name="blockKey" value={b.inicio} />
                  <button
                    type="submit"
                    className={isChecked ? "btn sm" : "btn sm primary"}
                    style={isChecked ? { color: "var(--pos)", borderColor: "var(--pos-soft)" } : undefined}
                  >
                    {isChecked ? "✓ Feito" : "Marcar"}
                  </button>
                </form>
              ) : (
                <span className={isChecked ? "pill pos" : "pill zero"}>{isChecked ? "✓ feito" : "—"}</span>
              )}
            </div>
          );
        })}
      </div>

      {canToggle && <div className="muted small">Cada item marcado vale 1 ponto de produtividade.</div>}
    </div>
  );
}
