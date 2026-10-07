import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Plane, Users } from "lucide-react";
import {
  currentUser,
  getOwnedJobs,
  getManpowerListing,
  getVendorInvitations,
} from "@/lib/data";
import { configured } from "@/lib/supabase/server";
import { date, label, totalManpower } from "@/lib/domain";
import { ActionForm, CommandButton } from "@/components/action-form";
import { manpowerRate } from "@/components/manpower-card";
import { ProfessionalHistory } from "@/components/professional-history";
import { Badge, Empty, Field, Verified } from "@/components/ui";

export default async function ManpowerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, user] = await Promise.all([
    getManpowerListing(id),
    currentUser(),
  ]);
  if (!listing) notFound();
  const [requirements, invitations] =
    user?.role === "COMPANY"
      ? await Promise.all([getOwnedJobs(), getVendorInvitations()])
      : [[], []];
  const openRequirements = requirements.filter(
    (job) =>
      job.status === "OPEN" &&
      job.vendors &&
      job.deadline >= new Date().toISOString().slice(0, 10),
  );
  const existingInvitation = invitations.find(
    (invitation) =>
      invitation.manpower_listing_id === listing.id &&
      ["PENDING", "VIEWED", "PROPOSAL_SUBMITTED"].includes(invitation.status),
  );
  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link href="/manpower">Available manpower</Link>
        <span>/</span>
        <span>{listing.city}</span>
      </div>
      <div className="detail-layout">
        <div>
          <header className="detail-head">
            <div className="badges">
              <Badge tone={listing.status === "ACTIVE" ? "green" : "neutral"}>
                {label(listing.status)}
              </Badge>
              {listing.profiles.verified && <Verified />}
            </div>
            <h1>{listing.title}</h1>
            <p>
              <Link href={`/profiles/${listing.vendor_id}`}>
                <strong>{listing.profiles.name}</strong>
              </Link>
            </p>
            <div className="detail-meta">
              <span>
                <MapPin size={17} />
                {listing.city}, {listing.state}
              </span>
              <span>
                <Users size={17} />
                {totalManpower(listing)} people available
              </span>
              <span>
                <CalendarDays size={17} />
                Available {date(listing.available_from)}
              </span>
              <span>
                <Clock size={17} />
                Mobilizes in {listing.mobilization_days} days
              </span>
              {listing.willing_to_travel && (
                <span>
                  <Plane size={17} />
                  Willing to travel
                </span>
              )}
            </div>
          </header>
          <section className="panel">
            <h2>Available team</h2>
            <p>{listing.description}</p>
            <div className="table-wrap manpower-composition-table">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Available</th>
                    <th>Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {listing.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.worker_roles.name}</strong>
                      </td>
                      <td>{item.quantity_available}</td>
                      <td>
                        {item.minimum_experience_years}
                        {item.maximum_experience_years === null
                          ? "+"
                          : `–${item.maximum_experience_years}`}{" "}
                        years
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th>{totalManpower(listing)}</th>
                    <th />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="manpower-composition-cards">
              {listing.items.map((item) => (
                <article key={item.id}>
                  <strong>{item.worker_roles.name}</strong>
                  <span>{item.quantity_available} available</span>
                  <small>
                    {item.minimum_experience_years}
                    {item.maximum_experience_years === null
                      ? "+"
                      : `–${item.maximum_experience_years}`}{" "}
                    years
                  </small>
                </article>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Work capability</h2>
            <h3>Categories</h3>
            <div className="badges">
              {listing.categories.length ? (
                listing.categories.map((item) => (
                  <Badge key={item.id}>{item.name}</Badge>
                ))
              ) : (
                <span>Not specified</span>
              )}
            </div>
            <h3>Skills & specializations</h3>
            <div className="badges">
              {listing.skills.length ? (
                listing.skills.map((item) => (
                  <Badge key={item.id}>{item.name}</Badge>
                ))
              ) : (
                <span>Not specified</span>
              )}
            </div>
          </section>
          <section className="panel">
            <h2>Vendor information</h2>
            <dl className="definition-grid">
              <div>
                <dt>Vendor</dt>
                <dd>
                  <Link href={`/profiles/${listing.vendor_id}`}>
                    {listing.profiles.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{listing.profiles.experience} years</dd>
              </div>
              <div>
                <dt>Completed engagements</dt>
                <dd>{listing.profiles.completed_count}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>
                  {listing.profiles.rating
                    ? `${listing.profiles.rating} / 5`
                    : "No reviews yet"}
                </dd>
              </div>
              <div>
                <dt>Brands worked with</dt>
                <dd>{listing.profiles.brands || "Not specified"}</dd>
              </div>
              <div>
                <dt>Base location</dt>
                <dd>
                  {listing.profiles.city}, {listing.profiles.state}
                </dd>
              </div>
            </dl>
          </section>
          {configured() && (
            <ProfessionalHistory profileId={listing.vendor_id} />
          )}
        </div>
        <aside className="detail-aside">
          <section className="panel">
            <p className="eyebrow">MANPOWER RATE</p>
            <div className="rate">{manpowerRate(listing)}</div>
            <hr />
            <dl className="definition-grid single-column">
              <div>
                <dt>Available from</dt>
                <dd>{date(listing.available_from)}</dd>
              </div>
              <div>
                <dt>Mobilization</dt>
                <dd>Within {listing.mobilization_days} days</dd>
              </div>
              <div>
                <dt>Minimum engagement</dt>
                <dd>
                  {listing.minimum_engagement_days
                    ? `${listing.minimum_engagement_days} days`
                    : "Flexible"}
                </dd>
              </div>
              <div>
                <dt>Travel</dt>
                <dd>
                  {listing.willing_to_travel
                    ? "Available"
                    : "Local engagements"}
                </dd>
              </div>
            </dl>
            {user?.id === listing.vendor_id ? (
              <Link
                className="button"
                href={`/dashboard/manpower/${listing.id}/edit`}
              >
                Edit listing
              </Link>
            ) : user?.role === "COMPANY" ? (
              existingInvitation ? (
                <>
                  <div className="notice">
                    Invitation {label(existingInvitation.status).toLowerCase()}.
                  </div>
                  <Link
                    className="button"
                    href={`/dashboard/messages?job=${existingInvitation.requirement_id}`}
                  >
                    Message vendor
                  </Link>
                </>
              ) : openRequirements.length ? (
                <ActionForm
                  op="invite_vendor"
                  values={{ listing_id: listing.id }}
                  submit="Invite to requirement"
                >
                  <Field label="Open requirement">
                    <select name="requirement_id" required>
                      {openRequirements.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </ActionForm>
              ) : (
                <Empty
                  title="No open requirement"
                  body="Create an open vendor requirement before inviting this vendor."
                  href="/dashboard/requirements/new"
                  action="Create requirement"
                />
              )
            ) : user ? (
              <p>
                Company accounts can invite this vendor to an open requirement.
              </p>
            ) : (
              <Link className="button" href="/sign-in">
                Sign in to invite vendor
              </Link>
            )}
            {user?.role === "ADMIN" && listing.status === "ACTIVE" && (
              <CommandButton
                op="manpower_status"
                values={{ id: listing.id, status: "UNAVAILABLE" }}
                label="Mark unavailable"
                confirm="Remove this listing from the public marketplace?"
              />
            )}
            <small>
              Created {date(listing.created_at)} · updated{" "}
              {date(listing.updated_at)}
            </small>
          </section>
        </aside>
      </div>
    </div>
  );
}
