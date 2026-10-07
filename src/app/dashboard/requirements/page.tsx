import Link from "next/link";
import { getOwnedJobs, requireUser } from "@/lib/data";
import { PageTitle, Badge, Empty } from "@/components/ui";
import { label } from "@/lib/domain";
import { CommandButton } from "@/components/action-form";
export default async function MyJobs() {
  await requireUser("COMPANY");
  const jobs = await getOwnedJobs();
  return (
    <>
      <PageTitle
        title="My requirements"
        description="Manage publication, review applicants and track manpower fulfilment."
      >
        <Link className="button" href="/dashboard/requirements/new">
          + Post requirement
        </Link>
      </PageTitle>
      {jobs.length ? (
        jobs.map((j) => (
          <article className="submission-card" key={j.id}>
            <div className="submission-top">
              <div>
                <h2>
                  <Link href={`/requirements/${j.id}`}>{j.title}</Link>
                </h2>
                <p>
                  {j.city} · {j.duration}
                </p>
              </div>
              <Badge>{label(j.status)}</Badge>
            </div>
            <div className="actions">
              <Link
                className="button"
                href={`/dashboard/applications?job=${j.id}`}
              >
                Review applicants
              </Link>
              <Link
                className="button secondary"
                href={`/dashboard/requirements/new?duplicate=${j.id}`}
              >
                Duplicate
              </Link>
              {["OPEN", "CLOSED", "FILLED", "IN_PROGRESS"].includes(
                j.status,
              ) && (
                <CommandButton
                  op="job_status"
                  values={{ id: j.id, status: "COMPLETED" }}
                  label="Complete requirement"
                  confirm="Close this requirement as completed? All deployments must already be complete; remaining unfilled roles will stop accepting applications."
                />
              )}
              {["DRAFT", "PAUSED", "CLOSED"].includes(j.status) && (
                <CommandButton
                  op="job_status"
                  values={{ id: j.id, status: "OPEN" }}
                  label="Publish"
                />
              )}
              {j.status === "OPEN" && (
                <>
                  <CommandButton
                    op="job_status"
                    values={{ id: j.id, status: "PAUSED" }}
                    label="Pause"
                  />
                  <CommandButton
                    op="job_status"
                    values={{ id: j.id, status: "CLOSED" }}
                    label="Close applications"
                  />
                </>
              )}
              {["DRAFT", "OPEN", "PAUSED"].includes(j.status) && (
                <CommandButton
                  op="job_status"
                  values={{ id: j.id, status: "CANCELLED" }}
                  label="Cancel requirement"
                  confirm="Cancel this requirement and notify applicants?"
                />
              )}
            </div>
          </article>
        ))
      ) : (
        <Empty
          title="No requirements yet"
          body="Describe your next elevator project and the manpower you need."
          href="/dashboard/requirements/new"
          action="Post requirement"
        />
      )}
    </>
  );
}
