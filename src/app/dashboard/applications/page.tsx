import { requireUser, getSubmissions } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { Submissions } from "@/components/submissions";
export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const user = await requireUser();
  const { job } = await searchParams;
  return (
    <>
      <PageTitle
        title={
          user.role === "COMPANY"
            ? "Applicants & manpower proposals"
            : user.role === "VENDOR"
              ? "My manpower proposals"
              : "My applications"
        }
        description={
          user.role === "COMPANY"
            ? "Compare experience, rates and availability. Build the right team for each project."
            : "Track your submissions, conversations and selection status."
        }
      />
      <Submissions
        items={await getSubmissions()}
        company={user.role === "COMPANY"}
        job={job}
      />
    </>
  );
}
