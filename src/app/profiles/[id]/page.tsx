import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, getProfiles } from "@/lib/data";
import { configured, db } from "@/lib/supabase/server";
import { PageTitle, Badge, Verified, Field } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { money } from "@/lib/domain";
import { ProfessionalHistory } from "@/components/professional-history";
import { Avatar } from "@/components/avatar";
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profiles, user] = await Promise.all([getProfiles(), currentUser()]);
  const p = profiles.find((p) => p.id === id);
  if (!p) notFound();
  let reviews: { id: string; rating: number; body: string }[] = [];
  let skills = p.skills ?? [];
  if (configured()) {
    const client = await db();
    const [r, s] = await Promise.all([
      client.from("reviews").select("id,rating,body").eq("subject_id", id),
      client
        .from("profile_skills")
        .select("skills(id,name)")
        .eq("profile_id", id),
    ]);
    if (r.error || s.error) throw new Error((r.error ?? s.error)!.message);
    reviews = r.data ?? [];
    skills = (s.data ?? []).map((x) => x.skills) as unknown as typeof skills;
  }
  return (
    <div className="container section prose">
      <PageTitle
        eyebrow={
          p.kind === "VENDOR"
            ? "MANPOWER VENDOR"
            : p.kind === "COMPANY"
              ? "CLIENT COMPANY"
              : "ELEVATOR PROFESSIONAL"
        }
        title={p.name}
        description={`${p.primary_role} · ${p.city}, ${p.state}`}
      />
      <Avatar profile={p} />
      {p.verified && <Verified />}
      <div className="panel">
        <h2>About</h2>
        <p>{p.bio}</p>
        <dl className="definition-grid">
          <div>
            <dt>Experience</dt>
            <dd>{p.experience} years</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{p.availability || "Not specified"}</dd>
          </div>
          <div>
            <dt>Expected rate</dt>
            <dd>{money(p.expected_rate)} / day</dd>
          </div>
          <div>
            <dt>Completed engagements</dt>
            <dd>{p.completed_count}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>{p.rating ? p.rating + " / 5" : "No reviews yet"}</dd>
          </div>
          <div>
            <dt>Brands worked with</dt>
            <dd>{p.brands || "Not specified"}</dd>
          </div>
          <div>
            <dt>Languages</dt>
            <dd>{p.languages || "Not specified"}</dd>
          </div>
          <div>
            <dt>Travel</dt>
            <dd>{p.travel ? "Willing to travel" : "Ask about travel"}</dd>
          </div>
        </dl>
        <div className="badges">
          {skills.map((s) => (
            <Badge key={s.id}>{s.name}</Badge>
          ))}
        </div>
      </div>
      <div className="notice">
        Conversations begin after an application or proposal.{" "}
        <Link href="/dashboard/requirements/new">
          <strong>Post your project requirement →</strong>
        </Link>
      </div>
      {configured() && <ProfessionalHistory profileId={id} />}
      <section className="panel">
        <h2>Engagement reviews</h2>
        {reviews.length ? (
          reviews.map((r) => (
            <article key={r.id}>
              <strong>{r.rating} / 5</strong>
              <p>{r.body}</p>
            </article>
          ))
        ) : (
          <p>No written reviews yet.</p>
        )}
      </section>
      {user && user.id !== p.id && (
        <details className="panel">
          <summary>Report this profile</summary>
          <ActionForm
            op="report"
            values={{ profile_id: p.id }}
            submit="Submit report"
          >
            <Field label="Reason">
              <select name="reason">
                {[
                  "Fake profile",
                  "Fraudulent company",
                  "Inappropriate communication",
                  "Payment issue",
                  "Safety concern",
                  "Spam",
                  "Other",
                ].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Details">
              <textarea name="details" required minLength={10} />
            </Field>
          </ActionForm>
        </details>
      )}
    </div>
  );
}
