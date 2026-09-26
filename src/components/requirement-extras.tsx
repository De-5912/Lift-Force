import type { Job } from "@/lib/domain";
import { Field } from "./ui";
export function RequirementExtras({ source }: { source?: Job }) {
  return (
    <section className="panel">
      <h2>05 · Project & eligibility details</h2>
      <div className="form-grid">
        <Field label="Project type">
          <input
            name="project_type"
            defaultValue={source?.project_type}
            placeholder="Residential / commercial / hospital"
          />
        </Field>
        <Field label="Elevator type">
          <input
            name="elevator_type"
            defaultValue={source?.elevator_type}
            placeholder="Traction / hydraulic / MRL / escalator"
          />
        </Field>
        <Field label="Number of elevators">
          <input
            name="elevator_count"
            type="number"
            min="0"
            max="10000"
            defaultValue={source?.elevator_count ?? 0}
          />
        </Field>
        <Field label="Preferred worker locations">
          <input
            name="preferred_locations"
            defaultValue={source?.preferred_locations}
            placeholder="Cities or states"
          />
        </Field>
        <Field label="Minimum vendor team size">
          <input
            name="min_team_size"
            type="number"
            min="1"
            max="10000"
            defaultValue={source?.min_team_size ?? 1}
          />
        </Field>
        <Field label="Maximum vendor team size">
          <input
            name="max_team_size"
            type="number"
            min="1"
            max="10000"
            defaultValue={source?.max_team_size ?? 10000}
          />
        </Field>
        <Field label="Overtime rate (₹ / hour)">
          <input
            name="overtime_rate"
            type="number"
            min="0"
            defaultValue={source?.overtime_rate ?? 0}
          />
        </Field>
        {(["uniform", "local_transport"] as const).map((k) => (
          <Field
            key={k}
            label={k === "uniform" ? "Uniform" : "Local transportation"}
          >
            <select name={k} defaultValue={source?.[k] ?? "NO"}>
              <option value="YES">Provided</option>
              <option value="NO">Not provided</option>
              <option value="NEGOTIABLE">Negotiable</option>
            </select>
          </Field>
        ))}
      </div>
      <label className="check">
        <input
          type="checkbox"
          name="overtime"
          defaultChecked={source?.overtime}
        />
        Overtime available
      </label>
      <Field label="Required certifications">
        <textarea
          name="certifications"
          maxLength={1000}
          defaultValue={source?.certifications}
          placeholder="Safety, electrical or manufacturer training certificates"
        />
      </Field>
      <Field label="Documents required">
        <textarea
          name="documents_required"
          maxLength={1000}
          defaultValue={source?.documents_required}
          placeholder="Resume, relevant experience records, safety training certificate"
        />
      </Field>
    </section>
  );
}
