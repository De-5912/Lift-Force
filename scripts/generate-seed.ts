import { writeFileSync } from "node:fs";
import { profiles, demoJobs, id } from "../src/lib/demo";
const sql = (s: unknown): string =>
  s === null
    ? "null"
    : typeof s === "number" || typeof s === "boolean"
      ? String(s)
      : `'${String(s).replaceAll("'", "''")}'`;
const rows: string[] = [
  "-- LOCAL DEMO ONLY. Never seed these accounts into a production database.",
  "create extension if not exists pgcrypto with schema extensions;",
];
const emails = [
  "company@liftwork.test",
  "company2@liftwork.test",
  "vendor@liftwork.test",
  "worker@liftwork.test",
  "worker2@liftwork.test",
  "vendor2@liftwork.test",
];
for (const [i, p] of profiles.entries()) {
  rows.push(
    `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change) values('00000000-0000-0000-0000-000000000000',${sql(p.id)},'authenticated','authenticated',${sql(emails[i])},extensions.crypt('Liftwork-Demo-2026!',extensions.gen_salt('bf')),now(),'${JSON.stringify({ provider: "email", providers: ["email"] })}',${sql(JSON.stringify({ name: p.name, role: p.kind }))}::jsonb,now(),now(),'','','','');`,
  );
  rows.push(
    `insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values(gen_random_uuid(),${sql(p.id)},${sql(p.id)},${sql(JSON.stringify({ sub: p.id, email: emails[i] }))}::jsonb,'email',now(),now(),now());`,
  );
  const keys = [
    "city",
    "state",
    "bio",
    "experience",
    "primary_role",
    "availability",
    "expected_rate",
    "verified",
    "rating",
    "completed_count",
    "team_size",
  ] as const;
  rows.push(
    `update public.profiles set ${keys.map((k) => `${k}=${sql(p[k] ?? 0)}`).join(",")} where id=${sql(p.id)};`,
  );
  for (const skill of p.skills ?? [])
    rows.push(
      `insert into public.profile_skills values(${sql(p.id)},${sql(skill.id)});`,
    );
}
// Admin is promoted through a trusted local seed, never through signup metadata.
rows.push(
  `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change) values('00000000-0000-0000-0000-000000000000',${sql(id(9))},'authenticated','authenticated','admin@liftwork.test',extensions.crypt('Liftwork-Demo-2026!',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"name":"Local administrator","role":"WORKER"}',now(),now(),'','','','');`,
);
rows.push(
  `insert into auth.identities(id,user_id,provider_id,identity_data,provider,created_at,updated_at) values(gen_random_uuid(),${sql(id(9))},${sql(id(9))},'{"sub":"${id(9)}","email":"admin@liftwork.test"}','email',now(),now()); update public.accounts set role='ADMIN' where id=${sql(id(9))}; update public.profiles set kind='ADMIN' where id=${sql(id(9))};`,
);
for (const j of demoJobs) {
  const { profiles: _p, categories: _c, job_roles, job_skills, ...data } = j;
  void _p;
  void _c;
  const keys = Object.keys(data);
  rows.push(
    `insert into public.jobs(${keys.join(",")}) values(${Object.values(data).map(sql).join(",")});`,
  );
  rows.push(
    `insert into public.job_private values(${sql(j.id)},'Exact site details shared after selection');`,
  );
  for (const { worker_roles: _r, ...line } of job_roles) {
    void _r;
    rows.push(
      `insert into public.job_roles(${Object.keys(line).join(",")},job_id) values(${Object.values(line).map(sql).join(",")},${sql(j.id)});`,
    );
  }
  for (const s of job_skills ?? [])
    rows.push(
      `insert into public.job_skills values(${sql(j.id)},${sql(s.skills.id)});`,
    );
}
rows.push(
  `update public.jobs j set organization_id=o.id from public.organizations o where o.owner_id=j.owner_id;`,
);
rows.push(
  `insert into public.proposals(id,job_id,applicant_id,rate,rate_basis,start_date,message,experience,mobilization_days,terms) values('${id(4000)}','${id(1000)}','${id(3)}',1500,'DAY','2026-10-15','We can supply four installation technicians and six helpers. Our supervisor will coordinate mobilization with your site team.','Residential elevator installation teams across Bengaluru; guide rail alignment, mechanical erection and door installation.',5,'Monthly billing against approved attendance. Accommodation and PPE supplied by the client.');`,
);
rows.push(
  `insert into public.proposal_items values('${id(4000)}','${id(2000)}',4),('${id(4000)}','${id(2001)}',6);`,
);
rows.push(
  `insert into public.applications(id,job_id,applicant_id,job_role_id,rate,rate_basis,start_date,message,experience) values('${id(4001)}','${id(1000)}','${id(4)}','${id(2000)}',1600,'DAY','2026-10-15','I am available for the Whitefield installation project and can join the site induction before work begins.','Seven years of traction elevator installation, guide rail alignment and landing door installation.');`,
);
for (const [n, applicant] of [
  [5000, 3],
  [5001, 4],
]) {
  rows.push(
    `insert into public.conversations(id,job_id,company_id,applicant_id) values('${id(n)}','${id(1000)}','${id(1)}','${id(applicant)}');`,
  );
  rows.push(
    `insert into public.conversation_participants(conversation_id,user_id) values('${id(n)}','${id(1)}'),('${id(n)}','${id(applicant)}');`,
  );
}
rows.push(
  `insert into public.profile_history(profile_id,kind,title,organization,description,year) values('${id(4)}','PROJECT','Residential tower elevator installation','Bengaluru residential project','Mechanical erection, guide rail alignment and door installation with the site team.',2025),('${id(3)}','PROJECT','Multi-site manpower deployment','Residential and commercial clients','Coordinated installation technicians and helpers across three concurrent Bengaluru sites.',2025);`,
);
rows.push(
  `insert into public.profile_roles values('${id(4)}','${id(202)}'),('${id(5)}','${id(208)}'),('${id(3)}','${id(202)}'),('${id(3)}','${id(213)}'),('${id(3)}','${id(216)}');`,
);
rows.push(
  `insert into public.notifications(user_id,title,href) values('${id(1)}','Vertex submitted a partial manpower proposal','/dashboard/applications'),('${id(1)}','Arjun Kumar applied to the Whitefield installation project','/dashboard/applications');`,
);
writeFileSync("supabase/seed.sql", rows.join("\n") + "\n");
console.log(
  "Local seed generated: six requirements, six profiles and one administrator.",
);
