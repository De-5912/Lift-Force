import { requireUser } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Empty, Badge, Field } from "@/components/ui";
import { CommandButton, ActionForm } from "@/components/action-form";
type Deployment = {
  id: string;
  status: string;
  job_id: string;
  applicant_id: string;
  jobs: { title: string; owner_id: string };
  profiles: { name: string };
  deployment_items: {
    quantity: number;
    job_roles: { worker_roles: { name: string } };
  }[];
};
export default async function Deployments() {
  const user = await requireUser(),
    client = await db();
  const { data, error } = await client
    .from("deployments")
    .select(
      "*,jobs(title,owner_id),profiles!deployments_applicant_id_fkey(name),deployment_items(quantity,job_roles(worker_roles(name)))",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const { data: reviews, error: reviewError } = await client
    .from("reviews")
    .select("deployment_id")
    .eq("author_id", user.id);
  if (reviewError) throw new Error(reviewError.message);
  const { data: addresses, error: addressError } = await client
    .from("job_private")
    .select("*");
  if (addressError) throw new Error(addressError.message);
  return (
    <>
      <PageTitle
        title="Deployments"
        description="Confirm your project teams, track engagements and review completed work."
      />
      {data.length ? (
        (data as unknown as Deployment[]).map((d) => (
          <article className="submission-card" key={d.id}>
            <div className="submission-top">
              <div>
                <h2>{d.jobs.title}</h2>
                <p>{d.profiles.name}</p>
              </div>
              <Badge tone="green">{d.status}</Badge>
            </div>
            <div className="badges">
              {d.deployment_items.map((i, n) => (
                <Badge key={n}>
                  {i.quantity} × {i.job_roles.worker_roles.name}
                </Badge>
              ))}
            </div>
            {addresses?.find((a) => a.job_id === d.job_id)?.address && (
              <p>
                <strong>Private site address:</strong>{" "}
                {addresses.find((a) => a.job_id === d.job_id)?.address}
              </p>
            )}
            {user.id === d.jobs.owner_id && d.status !== "COMPLETED" && (
              <CommandButton
                op="deployment"
                values={{
                  id: d.id,
                  status: d.status === "SELECTED" ? "CONFIRMED" : "COMPLETED",
                }}
                label={
                  d.status === "SELECTED"
                    ? "Confirm deployment"
                    : "Mark engagement completed"
                }
                confirm={
                  d.status === "CONFIRMED"
                    ? "Confirm this engagement has been completed?"
                    : undefined
                }
              />
            )}{" "}
            {d.status === "COMPLETED" &&
              !reviews?.some((r) => r.deployment_id === d.id) && (
                <details>
                  <summary>Leave an engagement review</summary>
                  <ActionForm
                    op="review"
                    values={{ id: d.id }}
                    submit="Submit review"
                  >
                    <Field label="Rating">
                      <select name="rating">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} stars
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Your review">
                      <textarea
                        name="body"
                        required
                        minLength={5}
                        maxLength={3000}
                      />
                    </Field>
                  </ActionForm>
                </details>
              )}
          </article>
        ))
      ) : (
        <Empty
          title="No deployments yet"
          body="Selected applications and accepted proposals become deployments here."
        />
      )}
    </>
  );
}
