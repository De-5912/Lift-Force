import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Users, Clock } from "lucide-react";
import { currentUser, getJob } from "@/lib/data";
import { money, date, label } from "@/lib/domain";
import { Badge, Verified, Field } from "@/components/ui";
import { ActionForm, CommandButton } from "@/components/action-form";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, user] = await Promise.all([getJob(id), currentUser()]);
  if (!job) notFound();
  const open =
    job.status === "OPEN" &&
    job.deadline >= new Date().toISOString().slice(0, 10);
  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link href="/requirements">Requirements</Link>
        <span>/</span>
        <span>{job.city}</span>
      </div>
      <div className="detail-layout">
        <div>
          <div className="detail-head">
            <div className="badges">
              <Badge tone="green">{label(job.status)}</Badge>
              <Badge>{job.categories.name}</Badge>
            </div>
            <h1>{job.title}</h1>
            <div className="company-row">
              <div className="avatar">
                {job.profiles.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>
                  <Link href={`/profiles/${job.owner_id}`}>
                    {job.profiles.name}
                  </Link>
                </strong>
                {job.profiles.verified && <Verified />}
              </div>
            </div>
            <div className="detail-meta">
              <span>
                <MapPin size={17} />
                {job.city}, {job.state}
              </span>
              <span>
                <Users size={17} />
                {job.job_roles.reduce((n, r) => n + r.quantity, 0)} people
              </span>
              <span>
                <Clock size={17} />
                {job.duration}
              </span>
              <span>
                <CalendarDays size={17} />
                {date(job.start_date)}
              </span>
            </div>
          </div>
          <section className="panel">
            <h2>Project overview</h2>
            <p>{job.description}</p>
            <h2>Scope of work</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{job.scope}</p>
          </section>
          <section className="panel">
            <h2>Manpower requirement</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Experience</th>
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {job.job_roles.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.worker_roles.name}</strong>
                      </td>
                      <td>
                        {r.min_experience}+ years
                        {r.certifications && (
                          <small style={{ display: "block" }}>
                            Certificates: {r.certifications}
                          </small>
                        )}
                        {r.desired_skills && (
                          <small style={{ display: "block" }}>
                            Skills: {r.desired_skills}
                          </small>
                        )}
                        {!!r.budget && (
                          <small style={{ display: "block" }}>
                            Role budget: {money(r.budget)}
                          </small>
                        )}
                      </td>
                      <td>
                        {r.filled} / {r.quantity}
                        <div className="progress">
                          <span
                            style={{
                              width: `${(r.filled / r.quantity) * 100}%`,
                            }}
                          />
                        </div>
                        <small>{r.quantity - r.filled} remaining</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="badges">
              {job.job_skills?.map((s) => (
                <Badge key={s.skills.id}>{s.skills.name}</Badge>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Schedule & site</h2>
            <dl className="definition-grid">
              <div>
                <dt>Project / site</dt>
                <dd>{job.site_name}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>
                  {date(job.start_date)} – {date(job.end_date)}
                </dd>
              </div>
              <div>
                <dt>Working schedule</dt>
                <dd>{job.shift}</dd>
              </div>
              <div>
                <dt>Hours per shift</dt>
                <dd>{job.hours} hours</dd>
              </div>
            </dl>
            <p>
              <small>
                Exact site address is shared privately after selection.
              </small>
            </p>
          </section>
          <section className="panel">
            <h2>Facilities & expenses</h2>
            <dl className="definition-grid">
              {[
                ["Accommodation", job.accommodation],
                ["Food", job.food],
                ["Travel / local transportation", job.travel],
                ["PPE", job.ppe],
                ["Tools", job.tools],
                ["Uniform", job.uniform ?? "NO"],
                ["Local transportation", job.local_transport ?? "NO"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{label(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel">
            <h2>Safety & payment terms</h2>
            <dl className="definition-grid">
              <div>
                <dt>Project type</dt>
                <dd>{job.project_type || "Not specified"}</dd>
              </div>
              <div>
                <dt>Elevator type / count</dt>
                <dd>
                  {job.elevator_type || "Not specified"}
                  {job.elevator_count ? ` · ${job.elevator_count} units` : ""}
                </dd>
              </div>
              <div>
                <dt>Overtime</dt>
                <dd>
                  {job.overtime
                    ? `Available · ${money(job.overtime_rate ?? 0)} / hour`
                    : "Not available"}
                </dd>
              </div>
              <div>
                <dt>Vendor team size</dt>
                <dd>
                  {job.min_team_size ?? 1}–{job.max_team_size ?? 10000}
                </dd>
              </div>
              <div>
                <dt>Preferred locations</dt>
                <dd>{job.preferred_locations || "All locations"}</dd>
              </div>
            </dl>
            {job.certifications && (
              <p>
                <strong>Required certificates:</strong> {job.certifications}
              </p>
            )}
            {job.documents_required && (
              <p>
                <strong>Required documents:</strong> {job.documents_required}
              </p>
            )}
            <p>{job.safety}</p>
            <p>{job.payment_terms}</p>
          </section>
          {user && (
            <details className="panel">
              <summary>Report a concern</summary>
              <ActionForm
                op="report"
                values={{ job_id: job.id }}
                submit="Submit report"
              >
                <Field label="Reason">
                  <select name="reason">
                    {[
                      "Misleading job",
                      "Payment issue",
                      "Safety concern",
                      "Fraudulent company",
                      "Spam",
                      "Other",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Details">
                  <textarea
                    name="details"
                    required
                    minLength={10}
                    maxLength={5000}
                  />
                </Field>
              </ActionForm>
            </details>
          )}
        </div>
        <aside className="detail-aside">
          <div className="panel">
            <p className="eyebrow">PROJECT COMPENSATION</p>
            <div className="rate">
              {money(job.min_rate)}–{money(job.max_rate)}
            </div>
            <p>
              {job.rate_basis === "PROJECT"
                ? "Fixed project amount"
                : job.rate_basis === "NEGOTIATED"
                  ? "Negotiable"
                  : `per person / ${label(job.rate_basis).toLowerCase()}`}
            </p>
            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "22px 0",
              }}
            />
            <p>
              <strong>Apply by {date(job.deadline)}</strong>
            </p>
            <p>
              {job.individuals && "Individual workers"}
              {job.individuals && job.vendors && " & "}
              {job.vendors && "manpower vendors"} welcome.
            </p>
            {open ? (
              user?.id === job.owner_id ? (
                <Link className="button" href="/dashboard/applications">
                  Manage applicants
                </Link>
              ) : (
                <Link
                  className="button"
                  href={user ? `/requirements/${job.id}/apply` : "/sign-in"}
                >
                  {user?.role === "VENDOR"
                    ? "Submit manpower proposal"
                    : user?.role === "WORKER"
                      ? "Apply as individual"
                      : "Sign in to apply"}{" "}
                  ↗
                </Link>
              )
            ) : (
              <div className="notice">
                This requirement is not accepting applications.
              </div>
            )}
            {user && ["WORKER", "VENDOR"].includes(user.role) && (
              <CommandButton
                op="save"
                values={{ id: job.id }}
                label="Save requirement"
              />
            )}
            <small>Posted {date(job.created_at)}</small>
          </div>
          <div className="panel">
            <h2>Clear scope. Direct conversations.</h2>
            <p>
              Discuss availability, rates and project expectations with the
              company before confirming your deployment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
