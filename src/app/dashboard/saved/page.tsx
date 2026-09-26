import { requireUser, getJob } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/ui";
import { JobCard } from "@/components/job-card";
import { CommandButton } from "@/components/action-form";
export default async function Saved() {
  await requireUser();
  const client = await db();
  const { data, error } = await client.from("saved_jobs").select("job_id");
  if (error) throw new Error(error.message);
  const jobs = (await Promise.all(data.map((r) => getJob(r.job_id)))).filter(
    (j) => j !== null,
  );
  return (
    <>
      <PageTitle
        title="Saved requirements"
        description="Keep promising opportunities together and apply when you’re ready."
      />
      {jobs.length ? (
        <div className="job-grid">
          {jobs.map((j) => (
            <div key={j.id}>
              <JobCard job={j} />
              <CommandButton
                op="save"
                values={{ id: j.id, remove: true }}
                label="Remove bookmark"
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="No saved requirements"
          body="Save a requirement from its detail page to find it here later."
          href="/requirements"
          action="Browse requirements"
        />
      )}
    </>
  );
}
