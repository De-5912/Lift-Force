import { notFound } from "next/navigation";
import { getManpowerListing, getTaxonomy, requireUser } from "@/lib/data";
import { ManpowerListingForm } from "@/components/manpower-listing-form";
import { PageTitle } from "@/components/ui";

export default async function EditManpowerListing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("VENDOR");
  const { id } = await params;
  const [listing, taxonomy] = await Promise.all([
    getManpowerListing(id),
    getTaxonomy(),
  ]);
  if (!listing || listing.vendor_id !== user.id) notFound();
  return (
    <>
      <PageTitle
        title="Edit manpower listing"
        description="Update availability, team capacity, rates and specializations."
      />
      <ManpowerListingForm taxonomy={taxonomy} source={listing} />
    </>
  );
}
