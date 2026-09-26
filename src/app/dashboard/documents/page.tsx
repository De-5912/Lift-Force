import { requireUser } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/ui";
import { UploadForm } from "@/components/action-form";
export default async function Documents({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; owner?: string }>;
}) {
  await requireUser();
  const { job, owner } = await searchParams,
    client = await db();
  let query = client.from("attachments").select("id,name,created_at");
  if (job) query = query.eq("job_id", job);
  if (owner) query = query.eq("owner_id", owner);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (
    <>
      <PageTitle
        title="Project documents"
        description="Private documents are visible only to authorized project participants."
      />
      <div className="panel">
        <UploadForm jobId={job} />
      </div>
      {data.length ? (
        <div className="panel">
          {data.map((a) => (
            <p key={a.id}>
              <a href={`/api/documents/${a.id}`}>{a.name} ↗</a>
            </p>
          ))}
        </div>
      ) : (
        <Empty
          title="No shared documents"
          body="Upload a quotation, resume or supporting certificate for this requirement."
        />
      )}
    </>
  );
}
