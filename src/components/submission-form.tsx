"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { command, type ActionResult } from "@/app/actions";
import { rateBases, label, type Job } from "@/lib/domain";
import { Field } from "./ui";
import { Feedback } from "./action-form";
export function SubmissionForm({
  job,
  kind,
}: {
  job: Job;
  kind: "application" | "proposal";
}) {
  const [result, setResult] = useState<ActionResult>({}),
    [pending, start] = useTransition(),
    router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const items = job.job_roles
          .map((r) => ({ job_role_id: r.id, quantity: Number(f.get(r.id)) }))
          .filter((i) => i.quantity > 0);
        start(async () => {
          const res = await command("submit", {
            ...Object.fromEntries(f),
            kind,
            job_id: job.id,
            confirmed: f.get("confirmed") === "on",
            items,
            mobilization_days: Number(f.get("mobilization_days") ?? 0),
            terms: f.get("terms") ?? "",
          });
          setResult(res);
          if (res.success) {
            router.push("/dashboard/applications");
            router.refresh();
          }
        });
      }}
    >
      <div className="notice">
        {kind === "application"
          ? "You are applying as one individual worker."
          : "Offer the workers you can supply. Partial team proposals are welcome."}
      </div>
      {kind === "application" ? (
        <Field label="Requested role">
          <select name="job_role_id" required>
            {job.job_roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.worker_roles.name} · {r.min_experience}+ years
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="panel">
          <h2>Manpower offered</h2>
          {job.job_roles.map((r) => (
            <Field
              key={r.id}
              label={`${r.worker_roles.name} · ${r.quantity - r.filled} remaining`}
            >
              <input
                name={r.id}
                type="number"
                min="0"
                max={r.quantity}
                defaultValue="0"
              />
            </Field>
          ))}
        </div>
      )}
      <div className="form-grid">
        <Field label="Expected rate / quotation (₹)">
          <input name="rate" type="number" min="0" step="0.01" required />
        </Field>
        <Field label="Rate basis">
          <select name="rate_basis">
            {rateBases.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Earliest available start date">
          <input name="start_date" type="date" max={job.end_date} required />
        </Field>
        {kind === "proposal" && (
          <Field label="Mobilization time (days)">
            <input
              name="mobilization_days"
              type="number"
              min="0"
              max="365"
              required
            />
          </Field>
        )}
      </div>
      <Field label="Relevant experience">
        <textarea name="experience" minLength={5} maxLength={5000} required />
      </Field>
      <Field
        label={
          kind === "proposal" ? "Proposal message" : "Message to the company"
        }
      >
        <textarea name="message" minLength={10} maxLength={5000} required />
      </Field>
      {kind === "proposal" && (
        <Field label="Quotation terms">
          <textarea name="terms" maxLength={5000} />
        </Field>
      )}
      <label className="check">
        <input type="checkbox" name="confirmed" required />I confirm
        availability for this project.
      </label>
      <p>
        <small>
          You can upload supporting documents from your profile. Documents
          linked to this requirement are shared with its company.
        </small>
      </p>
      <button className="button" disabled={pending}>
        {pending
          ? "Submitting…"
          : kind === "proposal"
            ? "Submit manpower proposal"
            : "Send application"}
      </button>
      <Feedback result={result} />
    </form>
  );
}
