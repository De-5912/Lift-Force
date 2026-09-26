import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db, configured } from "./supabase/server";
import { demoJobs, profiles, categories, roles, skills } from "./demo";
import type { AccountRole, Job, Profile, Submission, Taxon } from "./domain";
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
const jobSelect =
  "*,profiles!jobs_owner_id_fkey(*),categories(*),job_roles(*,worker_roles(*)),job_skills(skills(*))";
export async function getJobs(owned = false): Promise<Job[]> {
  if (!configured()) return owned ? [] : demoJobs;
  const client = await db();
  let query = client.from("jobs").select(jobSelect);
  if (owned) {
    const user = await requireUser();
    query = query.eq("owner_id", user.id);
  } else
    query = query
      .eq("status", "OPEN")
      .gte("deadline", new Date().toISOString().slice(0, 10));
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as Job[];
}
export async function getJob(id: string): Promise<Job | null> {
  if (!configured()) return demoJobs.find((j) => j.id === id) ?? null;
  const client = await db();
  const { data, error } = await client
    .from("jobs")
    .select(jobSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as Job | null;
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
export async function getSubmissions(): Promise<Submission[]> {
  const client = await db();
  const [a, p] = await Promise.all([
    client
      .from("applications")
      .select(
        "*,profiles!applications_applicant_id_fkey(*),jobs(id,title,owner_id)",
      ),
    client
      .from("proposals")
      .select(
        "*,profiles!proposals_applicant_id_fkey(*),jobs(id,title,owner_id),proposal_items(*,job_roles(worker_roles(*)))",
      ),
  ]);
  if (a.error || p.error) throw new Error((a.error || p.error)!.message);
  return [
    ...a.data.map((s) => ({ ...s, kind: "application" as const })),
    ...p.data.map((s) => ({ ...s, kind: "proposal" as const })),
  ] as unknown as Submission[];
}
