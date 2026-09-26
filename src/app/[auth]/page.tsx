import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAuthAvailability } from "@/lib/supabase/server";
const titles: Record<string, string> = {
  "sign-in": "Welcome back",
  register: "Join the workforce network",
  "forgot-password": "Reset your password",
  "reset-password": "Choose a new password",
};
const callbackErrors: Record<string, string> = {
  confirmation:
    "The confirmation link was invalid or expired. Request a new link.",
  "missing-code": "The authentication callback did not include a code.",
  unavailable:
    "Supabase could not complete the authentication callback. Check the configured service and try again.",
};
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ auth: string }>;
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const { auth } = await params;
  const query = await searchParams;
  if (!titles[auth]) notFound();
  const availability = await getAuthAvailability();
  return (
    <div className="auth-wrap">
      <div className="panel">
        <p className="eyebrow">LIFTWORK ACCOUNTS</p>
        <h1>{titles[auth]}</h1>
        <p>Connect with India’s elevator project workforce.</p>
        {query.error && (
          <div className="feedback error">
            {callbackErrors[query.error] ?? callbackErrors.confirmation}
          </div>
        )}
        <AuthForm
          mode={auth}
          initialRole={
            ["COMPANY", "VENDOR", "WORKER"].includes(query.role ?? "")
              ? query.role
              : "WORKER"
          }
          enabled={availability.enabled}
          unavailableMessage={availability.message}
        />
      </div>
    </div>
  );
}
