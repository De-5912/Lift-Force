import Link from "next/link";
import { getVendorInvitations, requireUser } from "@/lib/data";
import { date, label } from "@/lib/domain";
import { CommandButton } from "@/components/action-form";
import { Badge, Empty, PageTitle } from "@/components/ui";

export default async function VendorInvitationsPage() {
  const user = await requireUser();
  if (!["VENDOR", "COMPANY"].includes(user.role))
    return (
      <Empty
        title="Invitations are for companies and vendors"
        body="This workspace has no vendor invitations."
      />
    );
  const invitations = await getVendorInvitations();
  return (
    <>
      <PageTitle
        title={
          user.role === "VENDOR"
            ? "Requirement invitations"
            : "Vendor invitations"
        }
        description={
          user.role === "VENDOR"
            ? "Review company requirements and continue through the normal proposal workflow."
            : "Track the manpower vendors you invited to open requirements."
        }
      />
      {!invitations.length ? (
        <Empty
          title={
            user.role === "VENDOR"
              ? "No invitations received"
              : "No vendors invited yet"
          }
          body={
            user.role === "VENDOR"
              ? "Companies can invite you after discovering an active manpower listing."
              : "Browse available manpower and invite a vendor to one of your open requirements."
          }
          href={user.role === "VENDOR" ? "/dashboard/manpower" : "/manpower"}
          action={
            user.role === "VENDOR"
              ? "Manage manpower listings"
              : "Browse manpower"
          }
        />
      ) : (
        invitations.map((invitation) => (
          <article className="submission-card" key={invitation.id}>
            <div className="submission-top">
              <div>
                <h2>{invitation.jobs.title}</h2>
                <p>
                  {user.role === "VENDOR"
                    ? invitation.company.name
                    : invitation.vendor.name}{" "}
                  · {invitation.vendor_manpower_listings.title}
                </p>
              </div>
              <Badge
                tone={
                  ["PENDING", "VIEWED"].includes(invitation.status)
                    ? "green"
                    : "neutral"
                }
              >
                {label(invitation.status)}
              </Badge>
            </div>
            <p>
              <small>Invited {date(invitation.created_at)}</small>
            </p>
            <div className="actions">
              <Link
                className="button"
                href={`/requirements/${invitation.requirement_id}`}
              >
                View requirement
              </Link>
              <Link
                className="button secondary"
                href={`/manpower/${invitation.manpower_listing_id}`}
              >
                View manpower listing
              </Link>
              <Link
                className="button secondary"
                href={`/dashboard/messages?job=${invitation.requirement_id}`}
              >
                Message
              </Link>
              {user.role === "VENDOR" &&
                ["PENDING", "VIEWED"].includes(invitation.status) && (
                  <>
                    {invitation.status === "PENDING" && (
                      <CommandButton
                        op="invitation_status"
                        values={{ id: invitation.id, status: "VIEWED" }}
                        label="Mark viewed"
                      />
                    )}
                    <Link
                      className="button"
                      href={`/requirements/${invitation.requirement_id}/apply`}
                    >
                      Submit proposal
                    </Link>
                    <CommandButton
                      op="invitation_status"
                      values={{ id: invitation.id, status: "DECLINED" }}
                      label="Decline"
                      confirm="Decline this invitation?"
                    />
                  </>
                )}
              {user.role === "COMPANY" &&
                ["PENDING", "VIEWED"].includes(invitation.status) && (
                  <CommandButton
                    op="invitation_status"
                    values={{ id: invitation.id, status: "CANCELLED" }}
                    label="Cancel invitation"
                    confirm="Cancel this invitation?"
                  />
                )}
            </div>
          </article>
        ))
      )}
    </>
  );
}
