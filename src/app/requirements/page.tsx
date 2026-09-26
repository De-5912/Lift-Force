import { getJobs, currentUser, getProfiles } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { Marketplace } from "@/components/marketplace";
export const metadata = { title: "Browse requirements" };
export default async function Requirements() {
  const user = await currentUser();
  const profile = user
    ? (await getProfiles()).find((p) => p.id === user.id)
    : undefined;
  return (
    <div className="container section">
      <PageTitle
        eyebrow="ELEVATOR PROJECT OPPORTUNITIES"
        title="Find your next project"
        description="Installation, maintenance, commissioning and more. Find work that fits your skills."
      />
      <Marketplace jobs={await getJobs()} profile={profile} />
    </div>
  );
}
