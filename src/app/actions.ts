"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/supabase/config";
export type ActionResult = { error?: string; success?: string; id?: string };
export async function authAction(
  mode: string,
  payload: unknown,
): Promise<ActionResult> {
  try {
    const schema = z.object({
      email: z.email().max(254),
      password: z.string().min(12).max(128).optional(),
      name: z.string().trim().min(2).max(180).optional(),
      role: z.enum(["COMPANY", "WORKER", "VENDOR"]).optional(),
    });
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      return { error: parsed.error.issues.map((i) => i.message).join(" ") };
    const p = parsed.data,
      client = await db();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    if (mode === "register") {
      if (!p.password || !p.name || !p.role)
        return { error: "Complete every required field." };
      const { error, data } = await client.auth.signUp({
        email: p.email,
        password: p.password,
        options: {
          data: { name: p.name, role: p.role },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) return { error: authErrorMessage(error) };
      return {
        success: data.session
          ? "Account created."
          : "Check your email to confirm your account.",
        id: data.session ? "signed-in" : undefined,
      };
    }
    if (mode === "sign-in") {
      if (!p.password) return { error: "Enter your password." };
      const { error } = await client.auth.signInWithPassword({
        email: p.email,
        password: p.password,
      });
      if (error) return { error: authErrorMessage(error) };
      revalidatePath("/", "layout");
      return { success: "Signed in.", id: "signed-in" };
    }
    if (mode === "forgot-password") {
      const { error } = await client.auth.resetPasswordForEmail(p.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error) return { error: authErrorMessage(error) };
      return {
        success: "If an account exists, a password reset email has been sent.",
      };
    }
    if (mode === "reset-password") {
      if (!p.password) return { error: "Enter a new password." };
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        return { error: "Open the password reset link from your email first." };
      const { error } = await client.auth.updateUser({ password: p.password });
      if (error) return { error: authErrorMessage(error) };
      return { success: "Password updated.", id: "signed-in" };
    }
    return { error: "Unknown authentication action." };
  } catch (e) {
    return { error: authErrorMessage(e) };
  }
}
export async function logout() {
  const client = await db();
  await client.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
