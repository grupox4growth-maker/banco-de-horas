"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/actions/auth";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({ label, block }: { label: string; block?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={"btn primary" + (block ? " block" : "")} type="submit" disabled={pending}>
      {pending ? "Aguarde…" : label}
    </button>
  );
}

export function ActionForm({
  action,
  submitLabel = "Salvar",
  children,
  block = false,
  extra,
}: {
  action: Action;
  submitLabel?: string;
  children: ReactNode;
  block?: boolean;
  extra?: ReactNode;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="grid" style={{ gap: 12 }}>
      {children}
      {state.error && <div className="banner err">{state.error}</div>}
      {state.ok && state.message && <div className="banner ok">{state.message}</div>}
      <div className="row wrapf">
        <SubmitButton label={submitLabel} block={block} />
        {extra}
      </div>
    </form>
  );
}
