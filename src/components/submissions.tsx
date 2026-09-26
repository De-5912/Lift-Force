"use client";
import Link from "next/link";
import { useState } from "react";
import { date, money, label, type Submission } from "@/lib/domain";
import { Badge, Empty, Verified } from "./ui";
import { CommandButton, UploadForm } from "./action-form";
export function Submissions({
  items,
  company,
  job,
}: {
  items: Submission[];
  company: boolean;
  job?: string;
}) {
  const [kind, setKind] = useState("all"),
    [status, setStatus] = useState("all"),
    [selected, setSelected] = useState<string[]>([]);
  const filtered = items.filter(
    (s) =>
      (!job || s.job_id === job) &&
      (kind === "all" || s.kind === kind) &&
      (status === "all" || s.status === status),
  );
  const comparison = items.filter((s) => selected.includes(s.id));
  return (
    <>
      <div className="search-bar">
        <label className="field">
          <span>Submission type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All submissions</option>
            <option value="application">Individual applications</option>
            <option value="proposal">Vendor proposals</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {[...new Set(items.map((s) => s.status))].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {comparison.length > 0 && (
        <section className="panel">
          <h2>Compare {comparison.length} applicants</h2>
          <p>Factual comparison only. Selection is your decision.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Experience</th>
                  <th>Rate</th>
                  <th>Available</th>
                  <th>Rating</th>
                  <th>Projects</th>
                  <th>Manpower</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((s) => (
                  <tr key={s.id}>
                    <td>{s.profiles.name}</td>
                    <td>{label(s.kind)}</td>
                    <td>{s.profiles.experience} years</td>
                    <td>
                      {money(s.rate)} / {label(s.rate_basis)}
                    </td>
                    <td>{date(s.start_date)}</td>
                    <td>{s.profiles.rating || "—"}</td>
                    <td>{s.profiles.completed_count}</td>
                    <td>
                      {s.kind === "application"
                        ? "1 worker"
                        : s.proposal_items
                            ?.map(
                              (i) =>
                                `${i.quantity} ${i.job_roles.worker_roles.name}`,
                            )
                            .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {!filtered.length ? (
        <Empty
          title={
            company
              ? "No applications or proposals yet"
              : "You haven’t submitted any applications or proposals yet"
          }
          body={
            company
              ? "Applicants will appear here when they respond to your requirements."
              : "Browse open elevator requirements to find your next project."
          }
          href={company ? "/dashboard/requirements" : "/requirements"}
          action={company ? "View requirements" : "Find work"}
        />
      ) : (
        filtered.map((s) => (
          <article className="submission-card" key={s.id}>
            <div className="submission-top">
              <div>
                <div className="badges">
                  <Badge>
                    {s.kind === "proposal"
                      ? "Manpower vendor"
                      : "Individual worker"}
                  </Badge>
                  <Badge
                    tone={
                      ["SHORTLISTED", "SELECTED", "ACCEPTED"].includes(s.status)
                        ? "green"
                        : "neutral"
                    }
                  >
                    {label(s.status)}
                  </Badge>
                </div>
                <h2>
                  {company ? (
                    <Link href={`/profiles/${s.applicant_id}`}>
                      {s.profiles.name}
                    </Link>
                  ) : (
                    s.jobs.title
                  )}
                </h2>
                {company && (
                  <p>
                    <Link href={`/requirements/${s.job_id}`}>
                      {s.jobs.title}
                    </Link>
                  </p>
                )}
                {s.profiles.verified && <Verified />}
              </div>
              {company && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, s.id]
                          : selected.filter((v) => v !== s.id),
                      )
                    }
                  />
                  Compare
                </label>
              )}
            </div>
            <div className="submission-facts">
              <span>{s.profiles.experience} years’ experience</span>
              <span>{s.profiles.city}</span>
              <span>
                <strong>{money(s.rate)}</strong> /{" "}
                {label(s.rate_basis).toLowerCase()}
              </span>
              <span>Available {date(s.start_date)}</span>
              {s.kind === "proposal" && (
                <span>Mobilizes in {s.mobilization_days} days</span>
              )}
            </div>
            {s.kind === "proposal" && (
              <div className="badges">
                {s.proposal_items?.map((i) => (
                  <Badge key={i.job_role_id}>
                    {i.quantity} × {i.job_roles.worker_roles.name}
                  </Badge>
                ))}
              </div>
            )}
            <p>{s.message}</p>
            <details>
              <summary>Experience, terms & supporting documents</summary>
              <p>{s.experience}</p>
              {s.terms && <p>{s.terms}</p>}
              <Link
                className="text-button"
                href={`/dashboard/documents?owner=${s.applicant_id}&job=${s.job_id}`}
              >
                View shared documents
              </Link>
              {!company && <UploadForm jobId={s.job_id} />}
            </details>
            <div className="actions">
              <Link
                className="button secondary"
                href={`/dashboard/messages?job=${s.job_id}`}
              >
                Message
              </Link>
              {company &&
                ![
                  "REJECTED",
                  "WITHDRAWN",
                  "SELECTED",
                  "ACCEPTED",
                  "DEPLOYMENT_CONFIRMED",
                  "COMPLETED",
                ].includes(s.status) && (
                  <>
                    <CommandButton
                      op="submission_status"
                      values={{
                        id: s.id,
                        kind: s.kind,
                        status: "UNDER_REVIEW",
                      }}
                      label="Review"
                    />
                    <CommandButton
                      op="submission_status"
                      values={{ id: s.id, kind: s.kind, status: "SHORTLISTED" }}
                      label="Shortlist"
                    />
                    <CommandButton
                      op="submission_status"
                      values={{
                        id: s.id,
                        kind: s.kind,
                        status:
                          s.kind === "proposal"
                            ? "NEGOTIATION"
                            : "INTERVIEW_REQUESTED",
                      }}
                      label={
                        s.kind === "proposal"
                          ? "Negotiate"
                          : "Request interview"
                      }
                    />
                    <CommandButton
                      op="submission_status"
                      values={{
                        id: s.id,
                        kind: s.kind,
                        status: s.kind === "proposal" ? "ACCEPTED" : "SELECTED",
                      }}
                      label={
                        s.kind === "proposal"
                          ? "Accept proposal"
                          : "Select worker"
                      }
                      confirm="Confirm this selection and allocate the offered manpower?"
                    />
                    <CommandButton
                      op="submission_status"
                      values={{ id: s.id, kind: s.kind, status: "REJECTED" }}
                      label="Reject"
                      confirm="Reject this submission?"
                    />
                  </>
                )}
              {!company &&
                [
                  "APPLIED",
                  "SUBMITTED",
                  "UNDER_REVIEW",
                  "SHORTLISTED",
                  "NEGOTIATION",
                  "INTERVIEW_REQUESTED",
                ].includes(s.status) && (
                  <CommandButton
                    op="submission_status"
                    values={{ id: s.id, kind: s.kind, status: "WITHDRAWN" }}
                    label="Withdraw"
                    confirm="Withdraw this submission? Reapplication is not enabled for this requirement."
                  />
                )}
            </div>
          </article>
        ))
      )}
    </>
  );
}
