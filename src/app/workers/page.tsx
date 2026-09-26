import { getProfiles } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { Directory } from "@/components/directory";
export default async function Workers() {
  return (
    <div className="container section">
      <PageTitle
        eyebrow="SKILLED PEOPLE. PROJECT-READY."
        title="Find elevator professionals"
        description="Discover technicians, engineers, helpers and supervisors across India."
      />
      <Directory profiles={await getProfiles("WORKER")} />
    </div>
  );
}
