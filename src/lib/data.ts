import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db, configured } from "./supabase/server";
import type { AccountRole } from "./domain";

export const currentUser = cache(async () => {
  if (!configured()) return null;
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client
    .from("accounts")
    .select("id,role,suspended")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(error.message);
  if (data.suspended)
    throw new Error("This account is suspended. Contact platform support.");
  return { id: user.id, email: user.email, role: data.role as AccountRole };
});

export async function requireUser(role?: AccountRole) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (role && user.role !== role) redirect("/dashboard");
  return user;
}
