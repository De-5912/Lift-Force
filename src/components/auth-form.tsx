"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authAction, type ActionResult } from "@/app/actions";
import { AUTH_ACTION_TIMEOUT_MS, withTimeout } from "@/lib/supabase/config";
import { Field } from "./ui";
import { Feedback } from "./action-form";
export function AuthForm({
  mode,
  initialRole = "WORKER",
  enabled,
  unavailableMessage,
}: {
  mode: string;
  initialRole?: string;
  enabled: boolean;
  unavailableMessage?: string;
}) {
  const [result, setResult] = useState<ActionResult>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const register = mode === "register",
    forgot = mode === "forgot-password",
    reset = mode === "reset-password";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setResult({});
    try {
      const response = await withTimeout(
        authAction(mode, payload),
        AUTH_ACTION_TIMEOUT_MS,
        "Authentication took too long. The configured Supabase service may be unavailable. Check the service and try again.",
      );
      setResult(response);
      if (response.id === "signed-in") {
        router.push(register ? "/dashboard/profile" : "/dashboard");
        router.refresh();
      }
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Authentication failed. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {!enabled && <div className="notice">{unavailableMessage}</div>}
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
      <button
        className="button"
        disabled={pending || !enabled}
        aria-busy={pending}
      >
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
