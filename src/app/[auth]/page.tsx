import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";

const titles: Record<string, string> = {
  "sign-in": "Welcome back",
  register: "Join the workforce network",
  "forgot-password": "Reset your password",
  "reset-password": "Choose a new password",
};

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ auth: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { auth } = await params;
  const query = await searchParams;
  if (!titles[auth]) notFound();
  return (
    <div className="auth-wrap">
      <div className="panel">
        <p className="eyebrow">LIFTWORK ACCOUNTS</p>
        <h1>{titles[auth]}</h1>
        <p>Connect with India’s elevator project workforce.</p>
        <AuthForm
          mode={auth}
          initialRole={
            ["COMPANY", "VENDOR", "WORKER"].includes(query.role ?? "")
              ? query.role
              : "WORKER"
          }
        />
      </div>
    </div>
  );
}
