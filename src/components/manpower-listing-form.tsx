"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { command, type ActionResult } from "@/app/actions";
import {
  label,
  manpowerRateTypes,
  type ManpowerListing,
  type Taxon,
} from "@/lib/domain";
import { Feedback } from "./action-form";
import { Field } from "./ui";

type ListingLine = {
  key: string;
  worker_role_id: string;
  quantity_available: number;
  minimum_experience_years: number;
  maximum_experience_years: number | "";
};

export function ManpowerListingForm({
  taxonomy,
  source,
}: {
  taxonomy: { categories: Taxon[]; roles: Taxon[]; skills: Taxon[] };
  source?: ManpowerListing;
}) {
  const [lines, setLines] = useState<ListingLine[]>(
    source?.items.map((item) => ({
      key: item.id,
      worker_role_id: item.worker_role_id,
      quantity_available: item.quantity_available,
      minimum_experience_years: item.minimum_experience_years,
      maximum_experience_years: item.maximum_experience_years ?? "",
    })) ?? [
      {
        key: "initial",
        worker_role_id: taxonomy.roles[0]?.id ?? "",
        quantity_available: 1,
        minimum_experience_years: 0,
        maximum_experience_years: "",
      },
    ],
  );
  const [rateType, setRateType] = useState(source?.rate_type ?? "NEGOTIATED");
  const [result, setResult] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
          id: source?.id,
          ...Object.fromEntries(form),
          willing_to_travel: form.has("willing_to_travel"),
          publish: source
            ? source.status === "ACTIVE"
            : form.get("publication") === "ACTIVE",
          categories: form.getAll("categories"),
          skills: form.getAll("skills"),
          items: lines.map((line) => ({
            worker_role_id: line.worker_role_id,
            quantity_available: line.quantity_available,
            minimum_experience_years: line.minimum_experience_years,
            maximum_experience_years: line.maximum_experience_years,
          })),
          minimum_rate:
            rateType === "NEGOTIATED" ? null : form.get("minimum_rate"),
          maximum_rate:
            rateType === "NEGOTIATED" ? null : form.get("maximum_rate"),
          rate_type: rateType,
        };
        startTransition(async () => {
          try {
            const response = await command("manpower_listing", payload);
            setResult(response);
            if (response.success) {
              router.push("/dashboard/manpower");
              router.refresh();
            }
          } catch {
            setResult({
              error: "Unable to save this manpower listing. Please try again.",
            });
          }
        });
      }}
    >
      <section className="panel">
        <h2>01 · Listing overview</h2>
        <Field label="Listing title">
          <input
            name="title"
            minLength={8}
            maxLength={180}
            required
            defaultValue={source?.title}
            placeholder="Installation team available — Bengaluru"
          />
        </Field>
        <Field label="Describe the available team">
          <textarea
            name="description"
            minLength={30}
            maxLength={5000}
            required
            defaultValue={source?.description}
            placeholder="Summarize team strengths, project experience and suitable engagements."
          />
        </Field>
        <div className="form-grid">
          <Field label="City">
            <input
              name="city"
              minLength={2}
              maxLength={100}
              required
              defaultValue={source?.city}
            />
          </Field>
          <Field label="State">
            <input
              name="state"
              minLength={2}
              maxLength={100}
              required
              defaultValue={source?.state}
            />
          </Field>
          <Field label="Available from">
            <input
              name="available_from"
              type="date"
              required
              defaultValue={source?.available_from}
            />
          </Field>
          <Field label="Mobilization time (days)">
            <input
              name="mobilization_days"
              type="number"
              min="0"
              max="365"
              required
              defaultValue={source?.mobilization_days ?? 0}
            />
          </Field>
          <Field label="Minimum engagement (days)">
            <input
              name="minimum_engagement_days"
              type="number"
              min="0"
              max="3650"
              required
              defaultValue={source?.minimum_engagement_days ?? 0}
            />
          </Field>
        </div>
        <label className="check">
          <input
            name="willing_to_travel"
            type="checkbox"
            defaultChecked={source?.willing_to_travel}
          />
          Willing to travel outside this location
        </label>
      </section>
      <section className="panel">
        <h2>02 · Manpower composition</h2>
        <p>
          Add every available role once. This listing represents a team
          offering, not one employee.
        </p>
        {lines.map((line, index) => (
          <div className="manpower-line" key={line.key}>
            <Field label="Worker role">
              <select
                value={line.worker_role_id}
                onChange={(event) =>
                  setLines(
                    lines.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, worker_role_id: event.target.value }
                        : item,
                    ),
                  )
                }
              >
                {taxonomy.roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                max="1000"
                value={line.quantity_available}
                onChange={(event) =>
                  setLines(
                    lines.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            quantity_available: Number(event.target.value),
                          }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Minimum experience">
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={line.minimum_experience_years}
                onChange={(event) =>
                  setLines(
                    lines.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            minimum_experience_years: Number(
                              event.target.value,
                            ),
                          }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Maximum experience">
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={line.maximum_experience_years}
                placeholder="No maximum"
                onChange={(event) =>
                  setLines(
                    lines.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            maximum_experience_years:
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                          }
                        : item,
                    ),
                  )
                }
              />
            </Field>
            <button
              className="icon-button"
              type="button"
              aria-label="Remove manpower role"
              disabled={lines.length === 1}
              onClick={() =>
                setLines(lines.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <button
          className="text-button"
          type="button"
          disabled={lines.length >= 20}
          onClick={() =>
            setLines([
              ...lines,
              {
                key: crypto.randomUUID(),
                worker_role_id: taxonomy.roles[0]?.id ?? "",
                quantity_available: 1,
                minimum_experience_years: 0,
                maximum_experience_years: "",
              },
            ])
          }
        >
          <Plus size={16} /> Add another role
        </button>
      </section>
      <section className="panel">
        <h2>03 · Work categories & skills</h2>
        <Field label="Elevator work categories">
          <div className="check-grid">
            {taxonomy.categories.map((category) => (
              <label className="check" key={category.id}>
                <input
                  name="categories"
                  type="checkbox"
                  value={category.id}
                  defaultChecked={source?.categories.some(
                    (item) => item.id === category.id,
                  )}
                />
                {category.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Skills & specializations">
          <div className="check-grid">
            {taxonomy.skills.map((skill) => (
              <label className="check" key={skill.id}>
                <input
                  name="skills"
                  type="checkbox"
                  value={skill.id}
                  defaultChecked={source?.skills.some(
                    (item) => item.id === skill.id,
                  )}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </Field>
      </section>
      <section className="panel">
        <h2>04 · Rate & publication</h2>
        <div className="form-grid">
          <Field label="Rate type">
            <select
              name="rate_type"
              value={rateType}
              onChange={(event) =>
                setRateType(
                  event.target.value as (typeof manpowerRateTypes)[number],
                )
              }
            >
              {manpowerRateTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "NEGOTIATED" ? "Negotiable" : label(type)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <input name="currency" value="INR" readOnly />
          </Field>
          {rateType !== "NEGOTIATED" && (
            <>
              <Field label="Minimum rate (₹)">
                <input
                  name="minimum_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={source?.minimum_rate ?? undefined}
                />
              </Field>
              <Field label="Maximum rate (₹)">
                <input
                  name="maximum_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={source?.maximum_rate ?? undefined}
                />
              </Field>
            </>
          )}
          {!source && (
            <Field label="Publication">
              <select name="publication" defaultValue="ACTIVE">
                <option value="ACTIVE">Publish as active</option>
                <option value="PAUSED">Save as paused</option>
              </select>
            </Field>
          )}
        </div>
        {source && (
          <p>
            <small>
              Status changes are managed from your Manpower Listings dashboard.
            </small>
          </p>
        )}
      </section>
      <button className="button" disabled={pending}>
        {pending
          ? "Saving…"
          : source
            ? "Save listing"
            : "Create manpower listing"}
      </button>
      <Feedback result={result} />
    </form>
  );
}
