"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authAction, type ActionResult } from "@/app/actions";
import { Field } from "./ui";

function Feedback({ result }: { result: ActionResult }) {
  if (!result.error && !result.success) return null;
  return (
    <div className={`feedback ${result.error ? "error" : ""}`} role="status">
      {result.error ?? result.success}
    </div>
  );
}

export function AuthForm({
  mode,
  initialRole = "WORKER",
}: {
  mode: string;
  initialRole?: string;
}) {
  const [result, setResult] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const register = mode === "register";
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setResult({});
    const response = await authAction(mode, payload);
    setResult(response);
    if (response.id === "signed-in") {
      router.push(register ? "/dashboard/profile" : "/dashboard");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit}>
      {register && (
        <>
          <Field label="I’m joining as">
            <select name="role" defaultValue={initialRole}>
              <option value="WORKER">Individual worker</option>
              <option value="VENDOR">Manpower vendor</option>
              <option value="COMPANY">Client company</option>
            </select>
          </Field>
          <Field label="Full name / company name">
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={180}
              required
            />
          </Field>
        </>
      )}
      <Field label="Email address">
        <input name="email" type="email" autoComplete="email" required />
      </Field>
      {!forgot && (
        <Field
          label={reset ? "New password" : "Password"}
          hint="Use at least 12 characters."
        >
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete={
              register || reset ? "new-password" : "current-password"
            }
            required
          />
        </Field>
      )}
      <button className="button" disabled={pending} aria-busy={pending}>
        {pending
          ? "Please wait…"
          : register
            ? "Create account"
            : forgot
              ? "Send reset link"
              : reset
                ? "Update password"
                : "Sign in"}
      </button>
      <Feedback result={result} />
      <div className="auth-links">
        <Link href={register ? "/sign-in" : "/register"}>
          {register ? "Already registered? Sign in" : "Create an account"}
        </Link>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}
