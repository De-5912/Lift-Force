import { requireUser, getTaxonomy } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Stat, Field, Badge } from "@/components/ui";
import { CommandButton, ActionForm } from "@/components/action-form";
export default async function Admin() {
  await requireUser("ADMIN");
  const client = await db();
  const { data: counts, error: countsError } = await client.rpc("run_command", {
    command: { op: "admin_stats" },
  });
  if (countsError) throw new Error(countsError.message);
  const [accounts, requests, reports, jobs, taxonomy, industries] =
    await Promise.all([
      client.from("accounts").select("id,role,suspended,profiles(name)"),
      client
        .from("verification_requests")
        .select("*,profiles(name)")
        .eq("status", "PENDING"),
      client.from("reports").select("*").eq("status", "OPEN"),
      client.from("jobs").select("id,title,status"),
      getTaxonomy(),
      client.from("industries").select("id,name"),
    ]);
  for (const r of [accounts, requests, reports, jobs, industries])
    if (r.error) throw new Error(r.error.message);
  return (
    <>
      <PageTitle
        title="Platform administration"
        description="Review verification requests, resolve reports and maintain the marketplace."
      />
      <div className="stats">
        <Stat label="Accounts" value={accounts.data?.length ?? 0} />
        <Stat
          label="Active requirements"
          value={jobs.data?.filter((j) => j.status === "OPEN").length ?? 0}
        />
        <Stat label="Pending verification" value={requests.data?.length ?? 0} />
        <Stat label="Open reports" value={reports.data?.length ?? 0} />
        <Stat label="Companies" value={counts.companies} />
        <Stat label="Workers" value={counts.workers} />
        <Stat label="Vendors" value={counts.vendors} />
        <Stat label="Completed requirements" value={counts.completed} />
        <Stat label="Applications" value={counts.applications} />
        <Stat label="Proposals" value={counts.proposals} />
      </div>
      <section className="panel">
        <h2>Verification requests</h2>
        {!requests.data?.length && <p>No pending verification requests.</p>}
        {requests.data?.map((v) => (
          <article className="submission-card" key={v.id}>
            <h3>{(v.profiles as unknown as { name: string }).name}</h3>
            <p>{v.notes}</p>
            <a
              className="text-button"
              href={`/dashboard/documents?owner=${v.user_id}`}
            >
              Review private documents →
            </a>
            <div className="actions">
              <CommandButton
                op="moderate"
                values={{
                  id: v.id,
                  action: "verify",
                  approve: true,
                  notes: "Business documents reviewed by platform staff.",
                }}
                label="Approve verification"
              />
              <CommandButton
                op="moderate"
                values={{
                  id: v.id,
                  action: "verify",
                  approve: false,
                  notes:
                    "Please provide additional supporting business documentation.",
                }}
                label="Reject request"
              />
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Reported listings & accounts</h2>
        {!reports.data?.length && <p>No open reports.</p>}
        {reports.data?.map((r) => (
          <article key={r.id} className="submission-card">
            <h3>{r.reason}</h3>
            <p>{r.details}</p>
            <div className="actions">
              {r.job_id && (
                <>
                  <a className="text-button" href={`/requirements/${r.job_id}`}>
                    View requirement
                  </a>
                  <CommandButton
                    op="moderate"
                    values={{ id: r.job_id, action: "close_job" }}
                    label="Deactivate listing"
                    confirm="Deactivate this requirement?"
                  />
                </>
              )}
              {r.profile_id && (
                <CommandButton
                  op="moderate"
                  values={{
                    id: r.profile_id,
                    action: "suspend",
                    suspended: true,
                  }}
                  label="Suspend account"
                  confirm="Suspend this account?"
                />
              )}
              <CommandButton
                op="moderate"
                values={{ id: r.id, action: "resolve" }}
                label="Resolve report"
              />
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Accounts</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Status</th>
                <th>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {accounts.data?.map((a) => (
                <tr key={a.id}>
                  <td>
                    {(a.profiles as unknown as { name: string })?.name ?? a.id}
                  </td>
                  <td>{a.role}</td>
                  <td>
                    <Badge>{a.suspended ? "Suspended" : "Active"}</Badge>
                  </td>
                  <td>
                    {a.role !== "ADMIN" && (
                      <CommandButton
                        op="moderate"
                        values={{
                          id: a.id,
                          action: "suspend",
                          suspended: !a.suspended,
                        }}
                        label={a.suspended ? "Restore" : "Suspend"}
                        confirm="Change this account’s access?"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Industry taxonomy</h2>
        <p>
          Elevator terminology is managed here, separate from the application’s
          core logic.
        </p>
        {(["categories", "worker_roles", "skills"] as const).map((table) => (
          <details key={table}>
            <summary>{table.replace("_", " ")}</summary>
            <ActionForm
              op="taxonomy"
              values={{ table, industry_id: industries.data?.[0]?.id }}
              submit="Save taxonomy entry"
            >
              <Field label="Entry">
                <select name="id">
                  <option value="">Add new entry</option>
                  {(table === "worker_roles"
                    ? taxonomy.roles
                    : taxonomy[table]
                  ).map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Name">
                <input name="name" minLength={2} maxLength={100} required />
              </Field>
            </ActionForm>
          </details>
        ))}
      </section>
    </>
  );
}
