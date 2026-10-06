import { getTaxonomy, requireUser } from "@/lib/data";
import { ManpowerListingForm } from "@/components/manpower-listing-form";
import { PageTitle } from "@/components/ui";

export default async function NewManpowerListing() {
  await requireUser("VENDOR");
  return (
    <>
      <PageTitle
        eyebrow="VENDOR SUPPLY"
        title="List available manpower"
        description="Publish one team offering with all available roles, quantities and specializations."
      />
      <ManpowerListingForm taxonomy={await getTaxonomy()} />
    </>
  );
}
