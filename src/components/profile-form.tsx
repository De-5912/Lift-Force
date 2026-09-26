"use client";
import { useState, useTransition } from "react";
import { command, type ActionResult } from "@/app/actions";
import type { Profile, Taxon } from "@/lib/domain";
import { Field } from "./ui";
import { Feedback } from "./action-form";
export function ProfileForm({
  profile,
  skills,
  roles,
  selectedRoles,
  selected,
  organization,
}: {
  profile: Profile;
  skills: Taxon[];
  roles: Taxon[];
  selectedRoles: string[];
  selected: string[];
  organization?: { phone: string; gst_number: string };
}) {
  const [result, setResult] = useState<ActionResult>({}),
    [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () =>
          setResult(
            await command("profile", {
              ...Object.fromEntries(f),
              skills: f.getAll("skills"),
              roles: f.getAll("roles"),
              travel: f.has("travel"),
              phone: f.get("phone") ?? "",
              gst_number: f.get("gst_number") ?? "",
              team_size: f.get("team_size") ?? 0,
            }),
          ),
        );
      }}
    >
      <div className="form-grid">
        <Field label="Full name / company name">
          <input
            name="name"
            defaultValue={profile.name}
            required
            minLength={2}
            maxLength={180}
          />
        </Field>
        <Field label="Primary role / specialization">
          <input
            name="primary_role"
            defaultValue={profile.primary_role}
            maxLength={100}
          />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={profile.city} required />
        </Field>
        <Field label="State">
          <input name="state" defaultValue={profile.state} required />
        </Field>
        <Field label="Years of experience">
          <input
            name="experience"
            type="number"
            min="0"
            max="60"
            defaultValue={profile.experience}
            required
          />
        </Field>
        <Field label="Expected daily rate (₹)">
          <input
            name="expected_rate"
            type="number"
            min="0"
            defaultValue={profile.expected_rate}
            required
          />
        </Field>
        <Field label="Availability">
          <input
            name="availability"
            defaultValue={profile.availability}
            placeholder="Available now / from 15 October"
          />
        </Field>
        <Field label="Website">
          <input name="website" type="url" defaultValue={profile.website} />
        </Field>
        <Field label="Languages">
          <input name="languages" defaultValue={profile.languages} />
        </Field>
        <Field label="Elevator brands worked with">
          <input
            name="brands"
            defaultValue={profile.brands}
            placeholder="List relevant brands"
          />
        </Field>
        <Field label="Elevator types worked on">
          <input
            name="elevator_types"
            defaultValue={profile.elevator_types}
            placeholder="Traction, hydraulic, MRL, escalators"
          />
        </Field>
        <Field
          label={
            profile.kind === "WORKER"
              ? "Preferred work locations"
              : "Operating cities / states"
          }
        >
          <input
            name="preferred_locations"
            defaultValue={profile.preferred_locations}
          />
        </Field>
        {profile.kind !== "WORKER" && (
          <>
            <Field label="Contact person">
              <input
                name="contact_person"
                defaultValue={profile.contact_person}
              />
            </Field>
            <Field label="Year established (0 if unspecified)">
              <input
                name="year_established"
                type="number"
                min="0"
                max="2100"
                defaultValue={profile.year_established ?? 0}
              />
            </Field>
            <Field label="Company size">
              <select
                name="company_size"
                defaultValue={profile.company_size ?? ""}
              >
                <option value="">Not specified</option>
                {["1–10", "11–50", "51–200", "201–500", "500+"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Contact phone (private)">
              <input
                name="phone"
                type="tel"
                defaultValue={organization?.phone}
              />
            </Field>
            <Field label="GST number (private, optional)">
              <input
                name="gst_number"
                maxLength={20}
                defaultValue={organization?.gst_number}
              />
            </Field>
            <Field label="Available manpower count">
              <input
                name="team_size"
                type="number"
                min="0"
                max="10000"
                defaultValue={profile.team_size ?? 0}
              />
            </Field>
          </>
        )}
      </div>
      <Field label="Biography / company description">
        <textarea
          name="bio"
          defaultValue={profile.bio}
          minLength={10}
          maxLength={5000}
          required
        />
      </Field>
      <label className="check">
        <input type="checkbox" name="travel" defaultChecked={profile.travel} />
        Willing to travel for projects
      </label>
      <h3>
        {profile.kind === "VENDOR"
          ? "Worker categories supplied"
          : "Manpower roles"}
      </h3>
      <div className="skill-options">
        {roles.map((r) => (
          <label className="skill-option" key={r.id}>
            <input
              name="roles"
              type="checkbox"
              value={r.id}
              defaultChecked={selectedRoles.includes(r.id)}
            />
            {r.name}
          </label>
        ))}
      </div>
      <h3>Skills & specializations</h3>
      <div className="skill-options">
        {skills.map((s) => (
          <label className="skill-option" key={s.id}>
            <input
              name="skills"
              type="checkbox"
              value={s.id}
              defaultChecked={selected.includes(s.id)}
            />
            {s.name}
          </label>
        ))}
      </div>
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
      <Feedback result={result} />
    </form>
  );
}
