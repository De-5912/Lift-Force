import { getProfiles } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { Directory } from "@/components/directory";
export default async function Vendors() {
  return (
    <div className="container section">
      <PageTitle
        eyebrow="MANPOWER PARTNERS"
        title="Find the team behind your project"
        description="Connect with vendors supplying experienced elevator installation and maintenance teams."
      />
      <Directory profiles={await getProfiles("VENDOR")} />
    </div>
  );
}
