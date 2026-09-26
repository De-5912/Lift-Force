import { db } from "@/lib/supabase/server";
import { ActionForm, CommandButton } from "./action-form";
import { Field, Badge } from "./ui";
export async function ProfessionalHistory({
  profileId,
  editable = false,
}: {
  profileId: string;
  editable?: boolean;
}) {
  const client = await db();
  const { data, error } = await client
    .from("profile_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("year", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    <section className="panel">
      <h2>Experience, projects & credentials</h2>
      {data.length ? (
        data.map((h) => (
          <article className="submission-card" key={h.id}>
            <Badge>{h.kind}</Badge>
            <h3>{h.title}</h3>
            <p>
              {h.organization} · {h.year}
            </p>
            <p>{h.description}</p>
            {editable && (
              <CommandButton
                op="remove_history"
                values={{ id: h.id }}
                label="Remove entry"
                confirm="Remove this history entry?"
              />
            )}
          </article>
        ))
      ) : (
        <p>No professional history has been added yet.</p>
      )}
      {editable && (
        <details>
          <summary>Add experience or a credential</summary>
          <ActionForm op="history" submit="Add history entry">
            <div className="form-grid">
              <Field label="Type">
                <select name="kind">
                  {[
                    "EMPLOYMENT",
                    "PROJECT",
                    "CERTIFICATION",
                    "TRAINING",
                    "EDUCATION",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Title / qualification">
                <input name="title" minLength={2} maxLength={180} required />
              </Field>
              <Field label="Employer, client or institution">
                <input name="organization" maxLength={180} />
              </Field>
              <Field label="Year">
                <input
                  name="year"
                  type="number"
                  min="1950"
                  max="2100"
                  defaultValue={2026}
                  required
                />
              </Field>
            </div>
            <Field label="Responsibilities, skills or credential details">
              <textarea name="description" maxLength={3000} />
            </Field>
          </ActionForm>
        </details>
      )}
    </section>
  );
}
