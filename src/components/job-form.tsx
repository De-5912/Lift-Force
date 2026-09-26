"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { command, type ActionResult } from "@/app/actions";
import { rateBases, label, type Job, type Taxon } from "@/lib/domain";
import { Field } from "./ui";
import { Feedback } from "./action-form";
import { RequirementExtras } from "./requirement-extras";
export function JobForm({
  taxonomy,
  source,
}: {
  taxonomy: { categories: Taxon[]; roles: Taxon[]; skills: Taxon[] };
  source?: Job;
}) {
  const [lines, setLines] = useState(
    source?.job_roles.map((r) => ({
      key: r.id,
      role_id: r.role_id,
      quantity: r.quantity,
      min_experience: r.min_experience,
    })) ?? [
      {
        key: "initial",
        role_id: taxonomy.roles[0]?.id,
        quantity: 1,
        min_experience: 0,
      },
    ],
  );
  const [result, setResult] = useState<ActionResult>({}),
    [pending, start] = useTransition(),
    router = useRouter();
  const input = (name: keyof Job, type = "text", required = true) => (
    <input
      name={name}
      type={type}
      required={required}
      defaultValue={source?.[name] as string | number | undefined}
    />
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const payload = {
          ...Object.fromEntries(f),
          lines: lines.map(({ role_id, quantity, min_experience }, index) => ({
            role_id,
            quantity,
            min_experience,
            certifications: f.get(`certifications_${index}`) ?? "",
            desired_skills: f.get(`desired_skills_${index}`) ?? "",
            budget: Number(f.get(`budget_${index}`) ?? 0),
          })),
          skills: f.getAll("skills"),
          individuals: f.has("individuals"),
          vendors: f.has("vendors"),
          publish: f.get("publication") === "OPEN",
          overtime: f.has("overtime"),
        };
        start(async () => {
          const res = await command("create_job", payload);
          setResult(res);
          if (res.success && res.id) {
            router.push(`/requirements/${res.id}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="panel">
        <h2>01 · Project information</h2>
        <Field label="Requirement title">
          <input
            name="title"
            minLength={8}
            maxLength={180}
            required
            defaultValue={source ? `${source.title} (copy)` : ""}
            placeholder="Installation manpower — residential tower project"
          />
        </Field>
        <div className="form-grid">
          <Field label="Work category">
            <select name="category_id" defaultValue={source?.category_id}>
              {taxonomy.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site / project name">{input("site_name")}</Field>
        </div>
        <Field label="Project overview">
          <textarea
            name="description"
            minLength={30}
            maxLength={5000}
            required
            defaultValue={source?.description}
          />
        </Field>
        <Field label="Detailed scope of work">
          <textarea
            name="scope"
            minLength={20}
            maxLength={5000}
            required
            defaultValue={source?.scope}
          />
        </Field>
        <div className="form-grid">
          <Field label="City">{input("city")}</Field>
          <Field label="State">{input("state")}</Field>
        </div>
        <Field
          label="Exact site address"
          hint="Visible only to your company and selected applicants."
        >
          <textarea name="address" maxLength={1000} />
        </Field>
      </div>
      <div className="panel">
        <h2>02 · Manpower roles</h2>
        <p>Add each role and the number of people required.</p>
        {lines.map((line, i) => (
          <div key={line.key}>
            <div className="role-line">
              <Field label="Worker role">
                <select
                  value={line.role_id}
                  onChange={(e) =>
                    setLines(
                      lines.map((l, n) =>
                        n === i ? { ...l, role_id: e.target.value } : l,
                      ),
                    )
                  }
                >
                  {taxonomy.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="People needed">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={line.quantity}
                  onChange={(e) =>
                    setLines(
                      lines.map((l, n) =>
                        n === i
                          ? { ...l, quantity: Number(e.target.value) }
                          : l,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Min. years">
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={line.min_experience}
                  onChange={(e) =>
                    setLines(
                      lines.map((l, n) =>
                        n === i
                          ? { ...l, min_experience: Number(e.target.value) }
                          : l,
                      ),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                aria-label={`Remove role ${i + 1}`}
                disabled={lines.length === 1}
                onClick={() => setLines(lines.filter((_, n) => n !== i))}
              >
                <Trash2 size={18} />
              </button>
            </div>
            <details style={{ marginBottom: 20 }}>
              <summary>Role-specific skills, certificates & budget</summary>
              <div className="form-grid">
                <Field label="Desired skills">
                  <input
                    name={`desired_skills_${i}`}
                    maxLength={1000}
                    defaultValue={source?.job_roles[i]?.desired_skills}
                  />
                </Field>
                <Field label="Certifications required">
                  <input
                    name={`certifications_${i}`}
                    maxLength={1000}
                    defaultValue={source?.job_roles[i]?.certifications}
                  />
                </Field>
                <Field label="Role budget (₹; 0 if unspecified)">
                  <input
                    name={`budget_${i}`}
                    type="number"
                    min="0"
                    defaultValue={source?.job_roles[i]?.budget ?? 0}
                  />
                </Field>
              </div>
            </details>
          </div>
        ))}
        <button
          type="button"
          className="button secondary"
          disabled={lines.length >= 20}
          onClick={() =>
            setLines([
              ...lines,
              {
                key: crypto.randomUUID(),
                role_id: taxonomy.roles[0].id,
                quantity: 1,
                min_experience: 0,
              },
            ])
          }
        >
          <Plus size={16} />
          Add another role
        </button>
        <h3 style={{ marginTop: 25 }}>Desired skills</h3>
        <div className="skill-options">
          {taxonomy.skills.map((s) => (
            <label key={s.id} className="skill-option">
              <input
                name="skills"
                type="checkbox"
                value={s.id}
                defaultChecked={source?.job_skills?.some(
                  (v) => v.skills.id === s.id,
                )}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>03 · Schedule & compensation</h2>
        <div className="form-grid">
          <Field label="Required start date">
            {input("start_date", "date")}
          </Field>
          <Field label="Expected end date">{input("end_date", "date")}</Field>
          <Field label="Application deadline">
            {input("deadline", "date")}
          </Field>
          <Field label="Duration">
            <input
              name="duration"
              required
              placeholder="e.g. 3 months"
              defaultValue={source?.duration}
            />
          </Field>
          <Field label="Working days / shift">
            <input
              name="shift"
              required
              defaultValue={source?.shift ?? "Monday–Saturday, day shift"}
            />
          </Field>
          <Field label="Hours per shift">
            <input
              name="hours"
              type="number"
              min="1"
              max="16"
              required
              defaultValue={source?.hours ?? 8}
            />
          </Field>
          <Field label="Rate basis">
            <select
              name="rate_basis"
              defaultValue={source?.rate_basis ?? "DAY"}
            >
              {rateBases.map((r) => (
                <option key={r} value={r}>
                  {label(r)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minimum rate (INR)">
            <input
              name="min_rate"
              type="number"
              min="0"
              required
              defaultValue={source?.min_rate}
            />
          </Field>
          <Field label="Maximum rate (INR)">
            <input
              name="max_rate"
              type="number"
              min="0"
              required
              defaultValue={source?.max_rate}
            />
          </Field>
        </div>
        <Field label="Payment terms">
          <textarea
            name="payment_terms"
            minLength={3}
            required
            defaultValue={source?.payment_terms}
            placeholder="Payment cycle, invoice terms and approval process"
          />
        </Field>
      </div>
      <RequirementExtras source={source} />
      <div className="panel">
        <h2>06 · Facilities & publication</h2>
        <div className="form-grid">
          {["accommodation", "food", "travel", "ppe", "tools"].map((f) => (
            <Field key={f} label={f === "ppe" ? "PPE" : label(f)}>
              <select
                name={f}
                defaultValue={(source?.[f as keyof Job] as string) ?? "NO"}
              >
                <option value="YES">Provided</option>
                <option value="NO">Not provided</option>
                <option value="NEGOTIABLE">Negotiable</option>
              </select>
            </Field>
          ))}
        </div>
        <label className="check">
          <input
            name="individuals"
            type="checkbox"
            defaultChecked={source?.individuals ?? true}
          />
          Accept individual applications
        </label>
        <label className="check">
          <input
            name="vendors"
            type="checkbox"
            defaultChecked={source?.vendors ?? true}
          />
          Accept vendor manpower proposals
        </label>
        <Field label="Safety requirements & special instructions">
          <textarea
            name="safety"
            maxLength={5000}
            defaultValue={source?.safety}
          />
        </Field>
        <Field label="Publication">
          <select name="publication">
            <option value="OPEN">Publish and accept applications</option>
            <option value="DRAFT">Save as draft</option>
          </select>
        </Field>
        <button className="button" disabled={pending}>
          {pending ? "Saving requirement…" : "Save requirement"}
        </button>
        <Feedback result={result} />
      </div>
    </form>
  );
}
