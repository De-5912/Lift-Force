"use client";
import { useState, useTransition, type ReactNode } from "react";
import { command, type ActionResult } from "@/app/actions";
import { useRouter } from "next/navigation";
export function Feedback({ result }: { result: ActionResult }) {
  return result.error || result.success ? (
    <div
      role={result.error ? "alert" : "status"}
      className={`feedback ${result.error ? "error" : ""}`}
    >
      {result.error ?? result.success}
    </div>
  ) : null;
}
export function ActionForm({
  op,
  values = {},
  children,
  submit = "Save",
  redirectTo,
  confirm,
}: {
  op: string;
  values?: Record<string, unknown>;
  children?: ReactNode;
  submit?: string;
  redirectTo?: string;
  confirm?: string;
}) {
  const [result, setResult] = useState<ActionResult>({}),
    [pending, start] = useTransition(),
    router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (confirm && !window.confirm(confirm)) return;
        const fields = Object.fromEntries(new FormData(form));
        start(async () => {
          const res = await command(op, { ...values, ...fields });
          setResult(res);
          if (res.success) {
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          }
        });
      }}
    >
      {children}
      <button className="button secondary" disabled={pending}>
        {pending ? "Saving…" : submit}
      </button>
      <Feedback result={result} />
    </form>
  );
}
export function CommandButton({
  op,
  values,
  label,
  confirm,
}: {
  op: string;
  values: Record<string, unknown>;
  label: string;
  confirm?: string;
}) {
  return (
    <ActionForm op={op} values={values} submit={label} confirm={confirm} />
  );
}
