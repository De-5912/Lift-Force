import { notFound, redirect } from "next/navigation";
import { getVisibleJob, requireUser } from "@/lib/data";
import { PageTitle, Empty } from "@/components/ui";
import { SubmissionForm } from "@/components/submission-form";
export default async function Apply({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "WORKER" && user.role !== "VENDOR") redirect("/dashboard");
  const { id } = await params;
  const job = await getVisibleJob(id);
  if (!job) notFound();
  if (
    (user.role !== "WORKER" && user.role !== "VENDOR") ||
    (user.role === "WORKER" && !job.individuals) ||
    (user.role === "VENDOR" && !job.vendors) ||
    job.status !== "OPEN" ||
    job.deadline < new Date().toISOString().slice(0, 10)
  )
    return (
      <Empty
        title="You can’t apply to this requirement"
        body="Check the accepted account types and requirement status."
        href={`/requirements/${id}`}
        action="Back to requirement"
      />
    );
  return (
    <div className="container section prose">
      <PageTitle
        title={
          user.role === "VENDOR"
            ? "Submit a manpower proposal"
            : "Apply as an individual"
        }
        description={job.title}
      />
      <div className="panel">
        <SubmissionForm
          job={job}
          kind={user.role === "VENDOR" ? "proposal" : "application"}
        />
      </div>
    </div>
  );
}
