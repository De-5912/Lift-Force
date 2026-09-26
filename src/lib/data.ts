import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db, configured } from "./supabase/server";
import { profiles, categories, roles, skills } from "./demo";
import type { AccountRole, Profile, Taxon } from "./domain";
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
export async function getProfiles(kind?: string): Promise<Profile[]> {
  if (!configured()) return profiles.filter((p) => !kind || p.kind === kind);
  const client = await db();
  let query = client
    .from("profiles")
    .select(
      "*,profile_skills(skills(id,name)),profile_roles(worker_roles(id,name))",
    );
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (
    data as unknown as (Profile & {
      profile_skills: { skills: Taxon }[];
      profile_roles: { worker_roles: Taxon }[];
    })[]
  ).map((p) => ({
    ...p,
    skills: p.profile_skills.map((s) => s.skills),
    supplied_roles: p.profile_roles.map((r) => r.worker_roles),
  }));
}
export async function getTaxonomy(): Promise<{
  categories: Taxon[];
  roles: Taxon[];
  skills: Taxon[];
}> {
  if (!configured()) return { categories, roles, skills };
  const client = await db();
  const results = await Promise.all(
    ["categories", "worker_roles", "skills"].map((t) =>
      client.from(t).select("id,name").order("name"),
    ),
  );
  for (const r of results) if (r.error) throw new Error(r.error.message);
  return {
    categories: results[0].data!,
    roles: results[1].data!,
    skills: results[2].data!,
  };
}
