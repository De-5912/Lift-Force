import { getManpowerListings, getTaxonomy } from "@/lib/data";
import { ManpowerMarketplace } from "@/components/manpower-marketplace";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Browse available manpower" };

export default async function ManpowerMarketplacePage() {
  const [listings, taxonomy] = await Promise.all([
    getManpowerListings(),
    getTaxonomy(),
  ]);
  return (
    <div className="container section">
      <PageTitle
        eyebrow="AVAILABLE ELEVATOR MANPOWER"
        title="Find a team ready for your project"
        description="Browse vendor teams by role, skill, location, capacity and availability, then invite the right vendor to an open requirement."
      />
      <ManpowerMarketplace listings={listings} taxonomy={taxonomy} />
    </div>
  );
}
