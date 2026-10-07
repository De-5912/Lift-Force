import { getTaxonomy, requireUser, getVisibleJob } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { JobForm } from "@/components/job-form";
export default async function NewJob({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const user = await requireUser("COMPANY");
  const { duplicate } = await searchParams;
  const source = duplicate ? await getVisibleJob(duplicate) : null;
  return (
    <>
      <PageTitle
        title={source ? "Duplicate requirement" : "Post a manpower requirement"}
        description="Define the project, the people you need and the working arrangements."
      />
      <JobForm
        taxonomy={await getTaxonomy()}
        source={source?.owner_id === user.id ? source : undefined}
      />
    </>
  );
}
