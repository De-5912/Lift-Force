import Link from "next/link";
import {
  requireUser,
  getMarketplaceJobs,
  getOwnedJobs,
  getManpowerListings,
  getSubmissions,
  getVendorInvitations,
} from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Stat, Empty, Badge } from "@/components/ui";
import { label, totalManpower } from "@/lib/domain";
export default async function Dashboard() {
  const user = await requireUser();
  const [jobs, submissions, client, manpowerListings, invitations] =
    await Promise.all([
      user.role === "COMPANY" ? getOwnedJobs() : getMarketplaceJobs(),
      getSubmissions(),
      db(),
      user.role === "VENDOR"
        ? getManpowerListings({ owned: true })
        : Promise.resolve([]),
      ["COMPANY", "VENDOR"].includes(user.role)
        ? getVendorInvitations()
        : Promise.resolve([]),
    ]);
  const { data: profile, error } = await client
    .from("profiles")
    .select(
      "name,bio,city,primary_role,availability,brands,languages,team_size",
    )
    .eq("id", user.id)
    .single();
  if (error) throw new Error(error.message);
  const { data: deployments, error: deploymentError } = await client
    .from("deployments")
    .select("id,status");
  if (deploymentError) throw new Error(deploymentError.message);
  const completion = Math.round(
    ([
      profile.name,
      profile.bio,
      profile.city,
      profile.primary_role,
      profile.availability,
      profile.brands,
      profile.languages,
    ].filter(Boolean).length /
      7) *
      100,
  );
  const requested = jobs.reduce(
      (n, j) => n + j.job_roles.reduce((a, r) => a + r.quantity, 0),
      0,
    ),
    filled = jobs.reduce(
      (n, j) => n + j.job_roles.reduce((a, r) => a + r.filled, 0),
      0,
    );
  return (
    <>
      <PageTitle
        eyebrow={`${label(user.role)} workspace`}
        title={`Welcome, ${profile.name.split(" ")[0]}`}
        description={
          user.role === "COMPANY"
            ? "Your project teams, applications and deployments at a glance."
            : user.role === "VENDOR"
              ? "Manage your available manpower, invitations, proposals and deployments."
              : "Keep your profile current and follow your project opportunities."
        }
      >
        <Link
          className="button"
          href={
            user.role === "COMPANY"
              ? "/dashboard/requirements/new"
              : user.role === "VENDOR"
                ? "/dashboard/manpower/new"
                : "/requirements"
          }
        >
          {user.role === "COMPANY"
            ? "+ Post manpower requirement"
            : user.role === "VENDOR"
              ? "+ List available manpower"
              : "Browse requirements ↗"}
        </Link>
      </PageTitle>
      {(!profile.bio || !profile.city) && (
        <div className="notice">
          Your profile needs a few more details.{" "}
          <Link href="/dashboard/profile">
            <strong>Complete your profile →</strong>
          </Link>
        </div>
      )}
      <div className="stats">
        <Stat
          label={
            user.role === "COMPANY"
              ? "Active requirements"
              : user.role === "VENDOR"
                ? "Active manpower listings"
                : "Open requirements"
          }
          value={
            user.role === "VENDOR"
              ? manpowerListings.filter((item) => item.status === "ACTIVE")
                  .length
              : jobs.filter((j) => j.status === "OPEN").length
          }
        />
        <Stat
          label="Individual applications"
          value={submissions.filter((s) => s.kind === "application").length}
        />
        <Stat
          label="Vendor proposals"
          value={submissions.filter((s) => s.kind === "proposal").length}
        />
        <Stat
          label={user.role === "COMPANY" ? "Manpower filled" : "Shortlisted"}
          value={
            user.role === "COMPANY"
              ? `${filled} / ${requested}`
              : submissions.filter((s) => s.status === "SHORTLISTED").length
          }
          detail={
            user.role === "COMPANY"
              ? `${requested ? Math.round((filled / requested) * 100) : 0}% fill rate`
              : undefined
          }
        />
      </div>
      <div className="stats">
        <Stat
          label={
            user.role === "COMPANY"
              ? "Draft requirements"
              : "Profile completion"
          }
          value={
            user.role === "COMPANY"
              ? jobs.filter((j) => j.status === "DRAFT").length
              : `${completion}%`
          }
        />
        <Stat
          label="Upcoming deployments"
          value={deployments.filter((d) => d.status === "SELECTED").length}
        />
        <Stat
          label="Active deployments"
          value={deployments.filter((d) => d.status === "CONFIRMED").length}
        />
        <Stat
          label={
            user.role === "VENDOR"
              ? "Listed available manpower"
              : user.role === "COMPANY"
                ? "Pending vendor invitations"
                : "Completed engagements"
          }
          value={
            user.role === "VENDOR"
              ? manpowerListings
                  .filter((item) => item.status === "ACTIVE")
                  .reduce((total, item) => total + totalManpower(item), 0)
              : user.role === "COMPANY"
                ? invitations.filter((item) =>
                    ["PENDING", "VIEWED"].includes(item.status),
                  ).length
                : deployments.filter((d) => d.status === "COMPLETED").length
          }
        />
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>
            {user.role === "COMPANY"
              ? "Your requirements"
              : "Recent applications & proposals"}
          </h2>
          <Link
            href={
              user.role === "COMPANY"
                ? "/dashboard/requirements"
                : "/dashboard/applications"
            }
          >
            View all →
          </Link>
        </div>
        {user.role === "COMPANY" ? (
          jobs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 5).map((j) => (
                    <tr key={j.id}>
                      <td>
                        <Link href={`/requirements/${j.id}`}>
                          <strong>{j.title}</strong>
                        </Link>
                      </td>
                      <td>{j.city}</td>
                      <td>
                        <Badge>{label(j.status)}</Badge>
                      </td>
                      <td>
                        {j.job_roles.reduce((n, r) => n + r.filled, 0)} /{" "}
                        {j.job_roles.reduce((n, r) => n + r.quantity, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Your first project starts here"
              body="Post the manpower roles, schedule and facilities for your project."
              href="/dashboard/requirements/new"
              action="Post a requirement"
            />
          )
        ) : submissions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td>{s.jobs.title}</td>
                    <td>{label(s.kind)}</td>
                    <td>
                      <Badge>{label(s.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No submissions yet"
            body="Find a project that matches your skills and availability."
            href="/requirements"
            action="Find work"
          />
        )}
      </section>
    </>
  );
}
