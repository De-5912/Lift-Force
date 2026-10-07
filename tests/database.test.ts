import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  id,
  categoryNames,
  roleNames,
  skillNames,
  demoJobs,
} from "../src/lib/demo";

test("PostgreSQL end-to-end workflows and adversarial authorization", async (t) => {
  const pg = new PGlite();
  try {
    await pg.exec(
      `create role anon; create role authenticated; create schema auth; create schema storage; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;`,
    );
    const migrations = readdirSync("supabase/migrations")
      .filter(
        (file) =>
          file.endsWith("_workforce_core.sql") ||
          file.endsWith("_available_manpower_marketplace.sql") ||
          file.endsWith("_manpower_invitation_listing_index.sql") ||
          file.endsWith("_requirement_role_isolation.sql"),
      )
      .sort();
    for (const file of migrations)
      await pg.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    await pg.exec('grant usage on schema storage to authenticated;grant select on storage.objects to authenticated;');
    await pg.query("insert into public.industries(id,name) values($1,$2)", [
      id(50),
      "Elevators",
    ]);
    for (const [table, names, offset] of [
      ["categories", categoryNames, 100],
      ["worker_roles", roleNames, 200],
      ["skills", skillNames, 300],
    ] as const)
      for (const [i, name] of names.entries())
        await pg.query(
          `insert into public.${table}(id,industry_id,name) values($1,$2,$3)`,
          [id(offset + i), id(50), name],
        );
    for (const [n, role] of [
      [1, "COMPANY"],
      [2, "COMPANY"],
      [3, "VENDOR"],
      [4, "WORKER"],
      [5, "WORKER"],
      [6, "VENDOR"],
      [9, "WORKER"],
    ] as const)
      await pg.query("insert into auth.users values($1,$2)", [
        id(n),
        JSON.stringify({ name: `Test ${role} ${n}`, role }),
      ]);
    await pg.exec(
      `update public.accounts set role='ADMIN' where id='${id(9)}';update public.profiles set experience=7;`,
    );
    const asUser = async (n: number, fn: () => Promise<unknown>) => {
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id(n),
      ]);
      await pg.exec("set role authenticated");
      try {
        return await fn();
      } finally {
        await pg.exec("reset role");
      }
    };
    const run = async (n: number, command: Record<string, unknown>) =>
      asUser(n, async () => {
        const r = await pg.query<{ result: { id?: string } }>(
          "select public.run_command($1::jsonb) as result",
          [JSON.stringify(command)],
        );
        return r.rows[0].result;
      }) as Promise<{ id?: string }>;
    const base = {
      ...demoJobs[0],
      op: "create_job",
      address: "Private test address",
      skills: [id(300)],
      lines: [
        { role_id: id(202), quantity: 6, min_experience: 3 },
        { role_id: id(213), quantity: 8, min_experience: 0 },
      ],
      publish: true,
      start_date: "2099-10-15",
      end_date: "2100-01-15",
      deadline: "2099-10-10",
    };
    const created = await run(1, base),
      jobId = created.id!;
    const lines = (
      await pg.query<{ id: string; role_id: string }>(
        "select id,role_id from public.job_roles where job_id=$1 order by role_id",
        [jobId],
      )
    ).rows;
    const technician = lines.find((l) => l.role_id === id(202))!.id,
      helper = lines.find((l) => l.role_id === id(213))!.id;
    const manpowerPayload = {
      op: "manpower_listing",
      title: "Installation team available in Bengaluru",
      description:
        "Installation technicians, helpers and a site supervisor are available for elevator projects.",
      city: "Bengaluru",
      state: "Karnataka",
      available_from: "2099-10-12",
      mobilization_days: 3,
      willing_to_travel: true,
      minimum_engagement_days: 30,
      rate_type: "NEGOTIATED",
      minimum_rate: null,
      maximum_rate: null,
      currency: "INR",
      categories: [id(100)],
      skills: [id(300), id(301)],
      items: [
        {
          worker_role_id: id(202),
          quantity_available: 6,
          minimum_experience_years: 3,
          maximum_experience_years: 10,
        },
        {
          worker_role_id: id(213),
          quantity_available: 8,
          minimum_experience_years: 0,
          maximum_experience_years: 5,
        },
      ],
      publish: true,
    };
    const manpower = await run(3, manpowerPayload);
    const invitation = await run(1, {
      op: "invite_vendor",
      listing_id: manpower.id,
      requirement_id: jobId,
    });
    const app = {
      op: "submit",
      kind: "application",
      job_id: jobId,
      job_role_id: technician,
      rate: 1500,
      rate_basis: "DAY",
      start_date: "2099-10-15",
      message: "Ready to work on this project.",
      experience: "Seven years elevator installation.",
      confirmed: true,
    };
    const proposal = {
      ...app,
      kind: "proposal",
      mobilization_days: 5,
      terms: "Monthly invoicing",
      items: [
        { job_role_id: technician, quantity: 4 },
        { job_role_id: helper, quantity: 6 },
      ],
    };
    const applied = await run(4, app),
      proposed = await run(3, proposal);
    const removeFixtureJob = async (job: string) => {
      for (const table of ["job_private", "job_skills", "job_roles"]) await pg.query(`delete from public.${table} where job_id=$1`, [job]);
      await pg.query("delete from public.jobs where id=$1", [job]);
    };
    await t.test("Requirement RLS isolates anonymous and competing companies including roles and skills", async () => {
      const other = await run(2, {...base, title:"Company B confidential installation"});
      for (const [table, column] of [["jobs","id"],["job_roles","job_id"],["job_skills","job_id"]]) {
        await pg.query("select set_config('request.jwt.claim.sub','',false)");
        await pg.exec("set role anon");
        try { assert.equal((await pg.query(`select * from public.${table}`)).rows.length,0); }
        finally { await pg.exec("reset role"); }
        await asUser(1, async () => {
          assert.ok((await pg.query(`select * from public.${table} where ${column}=$1`,[jobId])).rows.length>0);
          assert.equal((await pg.query(`select * from public.${table} where ${column}=$1`,[other.id])).rows.length,0);
        });
        for (const actor of [3,4,9]) await asUser(actor,async()=>assert.ok((await pg.query(`select * from public.${table} where ${column}=$1`,[other.id])).rows.length>0));
      }
      await asUser(1,async()=>assert.equal((await pg.query("select j.id,r.quantity,s.skill_id from public.jobs j join public.job_roles r on r.job_id=j.id join public.job_skills s on s.job_id=j.id where j.id=$1",[other.id])).rows.length,0));
      await assert.rejects(run(1,{op:"job_status",id:other.id,status:"CLOSED"}),/owner|own|denied|company/i);
      await asUser(1,async()=> {
        assert.ok((await pg.query("select id from public.vendor_manpower_listings where id=$1",[manpower.id])).rows.length);
        assert.equal((await pg.query("select id from public.profiles where kind in ('WORKER','VENDOR')")).rows.length,4);
      });
      await removeFixtureJob(other.id!);
    });
    await t.test("Submission history survives closure while unrelated users and expired discovery are denied", async () => {
      await pg.query("update public.jobs set status='CLOSED' where id=$1",[jobId]);
      for (const actor of [1,3,4,9]) await asUser(actor,async()=>assert.equal((await pg.query("select id from public.jobs where id=$1",[jobId])).rows.length,1));
      for (const actor of [2,5,6]) await asUser(actor,async()=>assert.equal((await pg.query("select id from public.jobs where id=$1",[jobId])).rows.length,0));
      await pg.query("update public.jobs set status='OPEN' where id=$1",[jobId]);
      const expired=await run(1,{...base,title:"Expired private requirement",deadline:"2020-01-01"});
      for (const actor of [3,4]) await asUser(actor,async()=>assert.equal((await pg.query("select id from public.jobs where id=$1",[expired.id])).rows.length,0));
      await asUser(9,async()=>assert.equal((await pg.query("select id from public.jobs where id=$1",[expired.id])).rows.length,1));
      await removeFixtureJob(expired.id!);
    });
    await t.test(
      "Vendor manpower listings enforce normalized validation and role authorization",
      async () => {
        const items = await pg.query<{ quantity_available: number }>(
          "select quantity_available from public.vendor_manpower_listing_items where listing_id=$1 order by quantity_available",
          [manpower.id],
        );
        assert.deepEqual(
          items.rows.map((item) => item.quantity_available),
          [6, 8],
        );
        await assert.rejects(run(4, manpowerPayload), /only vendors/i);
        await assert.rejects(
          run(3, {
            ...manpowerPayload,
            title: "Invalid quantity listing",
            items: [{ ...manpowerPayload.items[0], quantity_available: 0 }],
          }),
          /quantity_available|check constraint/i,
        );
        await assert.rejects(
          run(3, {
            ...manpowerPayload,
            title: "Invalid experience listing",
            items: [
              {
                ...manpowerPayload.items[0],
                minimum_experience_years: 8,
                maximum_experience_years: 2,
              },
            ],
          }),
          /experience|check constraint/i,
        );
      },
    );
    await t.test(
      "Listing ownership and status control marketplace visibility",
      async () => {
        await assert.rejects(
          run(6, { op: "manpower_status", id: manpower.id, status: "PAUSED" }),
          /access denied/i,
        );
        await run(3, {
          op: "manpower_status",
          id: manpower.id,
          status: "PAUSED",
        });
        await pg.query("select set_config('request.jwt.claim.sub','',false)");
        await pg.exec("set role anon");
        try {
          assert.equal(
            (
              await pg.query(
                "select id from public.vendor_manpower_listings where id=$1",
                [manpower.id],
              )
            ).rows.length,
            0,
          );
        } finally {
          await pg.exec("reset role");
        }
        await run(3, {
          op: "manpower_status",
          id: manpower.id,
          status: "ACTIVE",
        });
        const duplicated = await run(3, {
          op: "duplicate_manpower",
          id: manpower.id,
        });
        assert.equal(
          (
            await pg.query<{ status: string }>(
              "select status from public.vendor_manpower_listings where id=$1",
              [duplicated.id],
            )
          ).rows[0].status,
          "PAUSED",
        );
      },
    );
    await t.test(
      "Company invitations enforce requirement ownership and prevent duplicates",
      async () => {
        await assert.rejects(
          run(2, {
            op: "invite_vendor",
            listing_id: manpower.id,
            requirement_id: jobId,
          }),
          /open vendor requirements/i,
        );
        await assert.rejects(
          run(4, {
            op: "invite_vendor",
            listing_id: manpower.id,
            requirement_id: jobId,
          }),
          /only companies/i,
        );
        await assert.rejects(
          run(1, {
            op: "invite_vendor",
            listing_id: manpower.id,
            requirement_id: jobId,
          }),
          /duplicate|unique/i,
        );
        await asUser(2, async () =>
          assert.equal(
            (
              await pg.query(
                "select id from public.vendor_requirement_invitations where id=$1",
                [invitation.id],
              )
            ).rows.length,
            0,
          ),
        );
        const stored = await pg.query<{ status: string }>(
          "select status from public.vendor_requirement_invitations where id=$1",
          [invitation.id],
        );
        assert.equal(stored.rows[0].status, "PROPOSAL_SUBMITTED");
        const notification = await pg.query<{ title: string }>(
          "select title from public.notifications where user_id=$1 and title ilike '%invited requirement%' limit 1",
          [id(1)],
        );
        assert.match(notification.rows[0].title, /invited requirement/i);
      },
    );
    await t.test(
      "Reject duplicate applications and role spoofing",
      async () => {
        await assert.rejects(run(4, app), /duplicate/i);
        await assert.rejects(run(2, app), /eligible/i);
        await assert.rejects(
          pg.query("insert into auth.users values($1,$2)", [
            id(20),
            JSON.stringify({ name: "Admin attacker", role: "ADMIN" }),
          ]),
          /account type/i,
        );
      },
    );
    await t.test(
      "Company IDOR and direct table mutations are denied",
      async () => {
        await asUser(2, async () =>
          assert.equal(
            (await pg.query("select * from public.applications")).rows.length,
            0,
          ),
        );
        await assert.rejects(
          run(2, {
            op: "submission_status",
            id: applied.id,
            kind: "application",
            status: "SELECTED",
          }),
          /access denied/i,
        );
        await assert.rejects(
          asUser(4, () => pg.exec("update public.profiles set verified=true")),
          /permission denied/i,
        );
      },
    );
    await t.test(
      "Shortlist, message and partial vendor selection persist",
      async () => {
        await run(1, {
          op: "submission_status",
          id: proposed.id,
          kind: "proposal",
          status: "SHORTLISTED",
        });
        const conv = (
          await pg.query<{ id: string }>(
            "select id from public.conversations where applicant_id=$1",
            [id(3)],
          )
        ).rows[0].id;
        await run(1, {
          op: "message",
          conversation_id: conv,
          body: "Can your team mobilize within five days?",
        });
        await run(3, {
          op: "message",
          conversation_id: conv,
          body: "Yes, four technicians and six helpers are available.",
        });
        await assert.rejects(
          run(2, {
            op: "message",
            conversation_id: conv,
            body: "Unsolicited message",
          }),
          /access denied/i,
        );
        await run(1, {
          op: "submission_status",
          id: proposed.id,
          kind: "proposal",
          status: "ACCEPTED",
        });
        await run(1, {
          op: "submission_status",
          id: applied.id,
          kind: "application",
          status: "SELECTED",
        });
        assert.equal(
          (
            await pg.query<{ filled: number }>(
              "select filled from public.job_roles where id=$1",
              [technician],
            )
          ).rows[0].filled,
          5,
        );
      },
    );
    await t.test(
      "Over-allocation and repeat selection roll back completely",
      async () => {
        const other = await run(6, {
          ...proposal,
          items: [{ job_role_id: technician, quantity: 2 }],
        });
        await assert.rejects(
          run(1, {
            op: "submission_status",
            id: other.id,
            kind: "proposal",
            status: "ACCEPTED",
          }),
          /exceeds remaining/i,
        );
        assert.equal(
          (
            await pg.query(
              "select * from public.deployments where proposal_id=$1",
              [other.id],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          run(1, {
            op: "submission_status",
            id: applied.id,
            kind: "application",
            status: "SELECTED",
          }),
          /no longer available/i,
        );
      },
    );
    await t.test(
      "Private addresses and conversations have participant-scoped reads",
      async () => {
        await asUser(2, async () => {
          assert.equal(
            (await pg.query("select * from public.job_private")).rows.length,
            0,
          );
          assert.equal(
            (await pg.query("select * from public.messages")).rows.length,
            0,
          );
        });
        await asUser(4, async () =>
          assert.equal(
            (await pg.query("select * from public.job_private")).rows.length,
            1,
          ),
        );
      },
    );
    await t.test(
      "Complete deployment and allow exactly one review per participant",
      async () => {
        const dep = (
          await pg.query<{ id: string }>(
            "select id from public.deployments where application_id=$1",
            [applied.id],
          )
        ).rows[0].id;
        await assert.rejects(
          run(4, {
            op: "review",
            id: dep,
            rating: 5,
            body: "Great engagement.",
          }),
          /completed engagement/i,
        );
        await run(1, { op: "deployment", id: dep, status: "CONFIRMED" });
        await run(1, { op: "deployment", id: dep, status: "COMPLETED" });
        await run(4, {
          op: "review",
          id: dep,
          rating: 5,
          body: "Clear scope and safe working arrangements.",
        });
        await run(1, {
          op: "review",
          id: dep,
          rating: 5,
          body: "Skilled, reliable technician.",
        });
        await assert.rejects(
          run(4, {
            op: "review",
            id: dep,
            rating: 4,
            body: "Duplicate review.",
          }),
          /duplicate/i,
        );
        await assert.rejects(
          run(2, {
            op: "review",
            id: dep,
            rating: 1,
            body: "Unrelated company.",
          }),
          /participants/i,
        );
      },
    );
    await t.test(
      "Verification, reports, admin moderation and suspension",
      async () => {
        await run(3, {
          op: "verification",
          notes: "Business documents ready for review.",
        });
        const verification = (
          await pg.query<{ id: string }>(
            "select id from public.verification_requests",
          )
        ).rows[0].id;
        await assert.rejects(
          run(4, {
            op: "moderate",
            id: verification,
            action: "verify",
            approve: true,
            notes: "Spoofed",
          }),
          /administrator/i,
        );
        await run(9, {
          op: "moderate",
          id: verification,
          action: "verify",
          approve: true,
          notes: "Reviewed",
        });
        await run(4, {
          op: "report",
          job_id: jobId,
          reason: "Safety concern",
          details: "Please review the project safety arrangements.",
        });
        await run(9, {
          op: "moderate",
          id: id(6),
          action: "suspend",
          suspended: true,
        });
        await assert.rejects(run(6, { op: "save", id: jobId }), /suspended/i);
      },
    );
    await t.test(
      "Closed jobs reject new applications and public access excludes drafts",
      async () => {
        await run(1, { op: "job_status", id: jobId, status: "CLOSED" }).catch(
          (e) => {
            if (!String(e).includes("transition")) throw e;
          },
        );
        const closed = await run(1, {
          ...base,
          title: "Closed requirement for authorization testing",
        });
        await run(1, { op: "job_status", id: closed.id, status: "CLOSED" });
        await assert.rejects(
          run(5, { ...app, job_id: closed.id }),
          /not accepting/i,
        );
        const draft = await run(1, { ...base, publish: false });
        await pg.query("select set_config('request.jwt.claim.sub','',false)");
        await pg.exec("set role anon");
        try {
          assert.equal(
            (
              await pg.query("select * from public.jobs where id=$1", [
                draft.id,
              ])
            ).rows.length,
            0,
          );
          await assert.rejects(
            pg.query("select public.run_command($1)", [
              JSON.stringify({ op: "save", id: jobId }),
            ]),
            /permission denied/i,
          );
        } finally {
          await pg.exec("reset role");
        }
      },
    );
    await t.test(
      "Professional history ownership, team limits and private attachment isolation",
      async () => {
        await run(4, {
          op: "profile",
          name: "Arjun Kumar",
          city: "Bengaluru",
          state: "Karnataka",
          bio: "Experienced elevator installation technician.",
          experience: 7,
          primary_role: "Installation Technician",
          availability: "Available",
          expected_rate: 1600,
          skills: [id(300)],
          roles: [id(202)],
          role: "ADMIN",
          verified: true,
        });
        assert.equal(
          (
            await pg.query<{ role: string }>(
              "select role from public.accounts where id=$1",
              [id(4)],
            )
          ).rows[0].role,
          "WORKER",
        );
        assert.equal(
          (
            await pg.query<{ verified: boolean }>(
              "select verified from public.profiles where id=$1",
              [id(4)],
            )
          ).rows[0].verified,
          false,
        );
        assert.equal(
          (
            await pg.query(
              "select * from public.profile_roles where profile_id=$1",
              [id(4)],
            )
          ).rows.length,
          1,
        );
        await run(4, {
          op: "history",
          kind: "CERTIFICATION",
          title: "Working at height safety training",
          organization: "Training provider",
          description: "Fall prevention and safe access procedures.",
          year: 2026,
        });
        const history = (
          await pg.query<{ id: string }>(
            "select id from public.profile_history where profile_id=$1",
            [id(4)],
          )
        ).rows[0].id;
        await run(5, { op: "remove_history", id: history });
        assert.equal(
          (
            await pg.query(
              "select id from public.profile_history where id=$1",
              [history],
            )
          ).rows.length,
          1,
        );
        const limited = await run(1, {
          ...base,
          min_team_size: 10,
          max_team_size: 14,
        });
        const limitedRole = (
          await pg.query<{ id: string }>(
            "select id from public.job_roles where job_id=$1 limit 1",
            [limited.id],
          )
        ).rows[0].id;
        await assert.rejects(
          run(3, {
            ...proposal,
            job_id: limited.id,
            items: [{ job_role_id: limitedRole, quantity: 2 }],
          }),
          /team size/i,
        );
        await run(4, {
          op: "attachment",
          job_id: jobId,
          object_path: `${id(4)}/test.pdf`,
          name: "Resume.pdf",
          mime_type: "application/pdf",
          size_bytes: 200,
        });
        await pg.query('insert into storage.objects(bucket_id,name) values($1,$2)',['documents',`${id(4)}/test.pdf`]);
        await asUser(1,async()=>assert.equal((await pg.query('select * from storage.objects')).rows.length,1));
        await asUser(3,async()=>assert.equal((await pg.query('select * from storage.objects')).rows.length,0));
        await asUser(1, async () =>
          assert.equal(
            (await pg.query("select * from public.attachments")).rows.length,
            1,
          ),
        );
        await asUser(3, async () =>
          assert.equal(
            (await pg.query("select * from public.attachments")).rows.length,
            0,
          ),
        );
        await assert.rejects(
          run(5, {
            op: "attachment",
            job_id: jobId,
            object_path: `${id(5)}/test.pdf`,
            name: "Unrelated.pdf",
            mime_type: "application/pdf",
            size_bytes: 200,
          }),
          /participants/i,
        );
        await assert.rejects(run(4, { op: "admin_stats" }), /administrator/i);
        await run(9, { op: "admin_stats" });
        const policyAudit = await pg.query<{ relname: string }>(
          "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
        );
        assert.deepEqual(
          policyAudit.rows,
          [],
          "Every exposed application table has RLS",
        );
      },
    );
  } finally {
    await pg.close();
  }
});
