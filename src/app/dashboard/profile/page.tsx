import { requireUser, getTaxonomy } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { ProfessionalHistory } from "@/components/professional-history";
import { PhotoForm } from "@/components/photo-form";
import { PageTitle, Field, Badge } from "@/components/ui";
import { ActionForm, UploadForm } from "@/components/action-form";
import type { Profile } from "@/lib/domain";
export default async function MyProfile() {
  const user = await requireUser(),
    client = await db();
  const [p, s, o, v, t, a, roles] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).single(),
    client.from("profile_skills").select("skill_id").eq("profile_id", user.id),
    client
      .from("organizations")
      .select("phone,gst_number")
      .eq("owner_id", user.id)
      .maybeSingle(),
    client
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getTaxonomy(),
    client.from("attachments").select("id,name").eq("owner_id", user.id),
    client.from("profile_roles").select("role_id").eq("profile_id", user.id),
  ]);
  for (const r of [p, s, o, v, a, roles])
    if (r.error) throw new Error(r.error.message);
  return (
    <>
      <PageTitle
        title="My profile"
        description="Help companies and project partners understand your experience and availability."
      />
      <div className="panel">
        <PhotoForm />
        <ProfileForm
          profile={p.data as Profile}
          skills={t.skills}
          roles={t.roles}
          selectedRoles={(roles.data ?? []).map((r) => r.role_id)}
          selected={(s.data ?? []).map((x) => x.skill_id)}
          organization={o.data ?? undefined}
        />
      </div>
      <div className="panel">
        <h2>Supporting documents</h2>
        <p>
          Documents are private. Do not upload government identification
          numbers.
        </p>
        <UploadForm />
        {a.data?.map((file) => (
          <p key={file.id}>
            <a href={`/api/documents/${file.id}`}>{file.name} ↗</a>
          </p>
        ))}
      </div>
      <ProfessionalHistory profileId={user.id} editable />
      {["COMPANY", "VENDOR"].includes(user.role) && (
        <div className="panel">
          <h2>Profile verification</h2>
          <p>
            Manual document review by platform administrators. This is not legal
            or government verification.
          </p>
          {v.data?.map((request) => (
            <p key={request.id}>
              <Badge>{request.status}</Badge> {request.admin_notes}
            </p>
          ))}
          {!p.data.verified && !v.data?.some((x) => x.status === "PENDING") && (
            <ActionForm op="verification" submit="Request verification">
              <Field label="Business details for review">
                <textarea
                  name="notes"
                  minLength={10}
                  maxLength={5000}
                  required
                />
              </Field>
            </ActionForm>
          )}
        </div>
      )}
    </>
  );
}
