import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Plane, Users } from "lucide-react";
import type { ManpowerListing } from "@/lib/domain";
import { date, label, money, totalManpower } from "@/lib/domain";
import { Avatar } from "./avatar";
import { Badge, Verified } from "./ui";

export function manpowerRate(listing: ManpowerListing) {
  if (listing.rate_type === "NEGOTIATED") return "Negotiable";
  const range =
    listing.minimum_rate === listing.maximum_rate
      ? money(listing.minimum_rate ?? 0)
      : `${money(listing.minimum_rate ?? 0)}–${money(listing.maximum_rate ?? 0)}`;
  if (listing.rate_type === "PROJECT") return `${range} · project basis`;
  return `${range} · per person / ${label(listing.rate_type).toLowerCase()}`;
}

export function ManpowerCard({ listing }: { listing: ManpowerListing }) {
  return (
    <article className="job-card manpower-card">
      <div className="company-row">
        <Avatar profile={listing.profiles} />
        <div>
          <strong>{listing.profiles.name}</strong>
          {listing.profiles.verified && <Verified />}
        </div>
      </div>
      <h3>
        <Link href={`/manpower/${listing.id}`}>{listing.title}</Link>
      </h3>
      <div className="meta-row">
        <MapPin size={15} />
        {listing.city}, {listing.state}
      </div>
      <div className="meta-row">
        <Users size={15} />
        {totalManpower(listing)} people available
      </div>
      <div className="meta-row">
        <CalendarDays size={15} />
        Available {date(listing.available_from)} · mobilizes in{" "}
        {listing.mobilization_days} days
      </div>
      <div className="badges">
        {listing.items.slice(0, 3).map((item) => (
          <Badge key={item.id}>
            {item.quantity_available} {item.worker_roles.name}
          </Badge>
        ))}
        {listing.items.length > 3 && (
          <Badge>+{listing.items.length - 3} roles</Badge>
        )}
        {listing.willing_to_travel && (
          <Badge tone="green">
            <Plane size={12} /> Will travel
          </Badge>
        )}
      </div>
      <div className="card-footer">
        <div className="rate">
          {manpowerRate(listing)}
          <small>
            {listing.categories
              .slice(0, 2)
              .map((item) => item.name)
              .join(" · ")}
          </small>
        </div>
        <Link href={`/manpower/${listing.id}`}>
          View manpower <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
