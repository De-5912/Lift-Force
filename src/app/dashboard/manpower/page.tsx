import Link from "next/link";
import {
  requireUser,
  getManpowerListings,
  getVendorInvitations,
} from "@/lib/data";
import { date, label, totalManpower } from "@/lib/domain";
import { CommandButton } from "@/components/action-form";
import { Badge, Empty, PageTitle, Stat } from "@/components/ui";

export default async function VendorManpowerDashboard() {
  await requireUser("VENDOR");
  const [listings, invitations] = await Promise.all([
    getManpowerListings({ owned: true }),
    getVendorInvitations(),
  ]);
  return (
    <>
      <PageTitle
        title="Manpower listings"
        description="Publish the teams and role capacity you can currently supply."
      >
        <Link className="button" href="/dashboard/manpower/new">
          + List available manpower
        </Link>
      </PageTitle>
      <div className="stats">
        <Stat
          label="Active listings"
          value={listings.filter((item) => item.status === "ACTIVE").length}
        />
        <Stat
          label="Available manpower"
          value={listings
            .filter((item) => item.status === "ACTIVE")
            .reduce((total, item) => total + totalManpower(item), 0)}
        />
        <Stat label="Invitations received" value={invitations.length} />
        <Stat
          label="Pending invitations"
          value={
            invitations.filter((item) =>
              ["PENDING", "VIEWED"].includes(item.status),
            ).length
          }
        />
      </div>
      {!listings.length ? (
        <Empty
          title="You haven't listed any available manpower yet"
          body="Publish your current team capacity so companies can discover and invite you."
          href="/dashboard/manpower/new"
          action="Create manpower listing"
        />
      ) : (
        listings.map((listing) => (
          <article className="submission-card" key={listing.id}>
            <div className="submission-top">
              <div>
                <h2>
                  <Link href={`/manpower/${listing.id}`}>{listing.title}</Link>
                </h2>
                <p>
                  {listing.city}, {listing.state} · {totalManpower(listing)}{" "}
                  people
                </p>
              </div>
              <Badge tone={listing.status === "ACTIVE" ? "green" : "neutral"}>
                {label(listing.status)}
              </Badge>
            </div>
            <div className="badges">
              {listing.items.map((item) => (
                <Badge key={item.id}>
                  {item.quantity_available} {item.worker_roles.name}
                </Badge>
              ))}
            </div>
            <p>
              <small>
                Created {date(listing.created_at)} · updated{" "}
                {date(listing.updated_at)}
              </small>
            </p>
            <div className="actions">
              <Link
                className="button"
                href={`/dashboard/manpower/${listing.id}/edit`}
              >
                Edit
              </Link>
              <CommandButton
                op="duplicate_manpower"
                values={{ id: listing.id }}
                label="Duplicate"
              />
              {listing.status === "ACTIVE" ? (
                <>
                  <CommandButton
                    op="manpower_status"
                    values={{ id: listing.id, status: "PAUSED" }}
                    label="Pause"
                  />
                  <CommandButton
                    op="manpower_status"
                    values={{ id: listing.id, status: "UNAVAILABLE" }}
                    label="Mark unavailable"
                    confirm="Mark this team unavailable and remove it from Browse Manpower?"
                  />
                </>
              ) : (
                <CommandButton
                  op="manpower_status"
                  values={{ id: listing.id, status: "ACTIVE" }}
                  label="Reactivate"
                />
              )}
            </div>
          </article>
        ))
      )}
    </>
  );
}
