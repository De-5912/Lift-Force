"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/supabase/config";
import { currentUser } from "@/lib/data";
export type ActionResult = { error?: string; success?: string; id?: string };
const profileSchema = z.object({
  roles: z.array(z.uuid()).max(30).default([]),
  preferred_locations: z.string().max(500).default(""),
  elevator_types: z.string().max(500).default(""),
  year_established: z.coerce.number().int().min(0).max(2100).default(0),
  company_size: z.string().max(100).default(""),
  contact_person: z.string().max(180).default(""),
  name: z.string().trim().min(2).max(180),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  bio: z.string().trim().min(10).max(5000),
  experience: z.coerce.number().int().min(0).max(60),
  primary_role: z.string().max(100),
  availability: z.string().max(100),
  expected_rate: z.coerce.number().min(0),
  website: z.string().max(300),
  languages: z.string().max(300),
  brands: z.string().max(500),
  travel: z.boolean(),
  team_size: z.coerce.number().int().min(0).max(10000),
  skills: z.array(z.uuid()).max(30),
  phone: z.string().max(30),
  gst_number: z.string().max(20),
});
const shortText = z.string().trim().min(1).max(5000);
const commands: Record<string, z.ZodType> = {
  history: z.object({
    kind: z.enum([
      "EMPLOYMENT",
      "PROJECT",
      "CERTIFICATION",
      "TRAINING",
      "EDUCATION",
    ]),
    title: z.string().trim().min(2).max(180),
    organization: z.string().max(180),
    description: z.string().max(3000),
    year: z.coerce.number().int().min(1950).max(2100),
  }),
  remove_history: z.object({ id: z.uuid() }),
  profile: profileSchema,
  verification: z.object({ notes: shortText }),
  report: z.object({
    job_id: z.union([z.uuid(), z.literal("")]).optional(),
    profile_id: z.union([z.uuid(), z.literal("")]).optional(),
    reason: shortText,
    details: z.string().trim().min(10).max(5000),
  }),
};
export async function command(
  op: string,
  payload: unknown,
): Promise<ActionResult> {
  try {
    if (!commands[op]) throw new Error("Unknown action.");
    const parsed = commands[op].safeParse(payload);
    if (!parsed.success)
      return { error: parsed.error.issues.map((i) => i.message).join(" ") };
    const user = await currentUser();
    if (!user) return { error: "Sign in to continue." };
    const client = await db();
    const { data, error } = await client.rpc("run_command", {
      command: { op, ...(parsed.data as object) },
    });
    if (error)
      return {
        error:
          error.code === "23505"
            ? "This record already exists. Duplicate submissions and reviews are not allowed."
            : error.message,
      };
    revalidatePath("/", "layout");
    return { success: "Changes saved.", id: data?.id ?? undefined };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Unable to save. Please try again.",
    };
  }
}
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
