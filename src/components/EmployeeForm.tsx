import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { updateEmployeeAction } from "@/lib/actions/employees";
import { WD, scheduleOf } from "@/lib/time";

type Emp = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  cargo: string | null;
  active: boolean;
  entrada: string | null;
  saidaAlmoco: string | null;
  voltaAlmoco: string | null;
  saida: string | null;
  cargaMin: number;
  descontarIntervalo: boolean;
  dias: number[];
};

export function EmployeeForm({ employee }: { employee: Emp }) {
  const s = scheduleOf(employee);

  return (
    <ActionForm
      action={updateEmployeeAction}
      submitLabel="Salvar"
      extra={
        <Link href={`/employees/${employee.id}`} className="btn ghost">
          Cancelar
        </Link>
      }
    >
      <input type="hidden" name="id" value={employee.id} />

      <div className="cols">
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input id="name" name="name" defaultValue={employee.name || ""} placeholder="Nome completo" />
        </div>
        <div className="field">
          <label htmlFor="cargo">Cargo (opcional)</label>
          <input id="cargo" name="cargo" defaultValue={employee.cargo || ""} placeholder="ex: Atendente" />
        </div>
      </div>

      <div className="cols">
        <div className="field">
          <label htmlFor="email">E-mail (recuperação de senha)</label>
          <input id="email" name="email" type="email" defaultValue={employee.email || ""} placeholder="funcionario@email.com" />
        </div>
        <div className="field">
          <label>Usuário (login)</label>
          <input value={employee.username ?? "—"} disabled />
        </div>
      </div>

      <div className="field">
        <label>Jornada padrão</label>
        <div className="muted small">Base para calcular atraso e banco de horas.</div>
      </div>
      <div className="cols">
        <div className="field">
          <label htmlFor="entrada">Entrada</label>
          <input id="entrada" name="entrada" type="time" defaultValue={s.entrada!} />
        </div>
        <div className="field">
          <label htmlFor="saidaAlmoco">Saída p/ almoço</label>
          <input id="saidaAlmoco" name="saidaAlmoco" type="time" defaultValue={s.saidaAlmoco!} />
        </div>
      </div>
      <div className="cols">
        <div className="field">
          <label htmlFor="voltaAlmoco">Volta do almoço</label>
          <input id="voltaAlmoco" name="voltaAlmoco" type="time" defaultValue={s.voltaAlmoco!} />
        </div>
        <div className="field">
          <label htmlFor="saida">Saída</label>
          <input id="saida" name="saida" type="time" defaultValue={s.saida!} />
        </div>
      </div>
      <div className="cols">
        <div className="field">
          <label htmlFor="cargaHoras">Carga diária (horas)</label>
          <input id="cargaHoras" name="cargaHoras" type="number" step="0.25" defaultValue={s.cargaMin / 60} />
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="checkline">
            <input type="checkbox" name="descontarIntervalo" defaultChecked={s.descontarIntervalo} />
            Descontar o intervalo do tempo trabalhado
          </label>
        </div>
      </div>

      <div className="field">
        <label>Dias de trabalho</label>
        <div className="daybtns">
          {WD.map((w, d) => (
            <label className="daybtn" key={d}>
              <input type="checkbox" name="dias" value={d} defaultChecked={s.dias.includes(d)} />
              <span>{w}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="checkline">
        <input type="checkbox" name="active" defaultChecked={employee.active} />
        Funcionário ativo
      </label>
    </ActionForm>
  );
}
