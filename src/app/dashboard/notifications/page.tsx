import Link from "next/link";
import { requireUser } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Empty, Badge } from "@/components/ui";
import { CommandButton } from "@/components/action-form";
export default async function Notifications() {
  await requireUser();
  const client = await db();
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (
    <>
      <PageTitle
        title="Notifications"
        description="Updates on your applications, proposals and project conversations."
      >
        <CommandButton
          op="read_notifications"
          values={{}}
          label="Mark all as read"
        />
      </PageTitle>
      {data.length ? (
        data.map((n) => (
          <article className="submission-card" key={n.id}>
            <div className="submission-top">
              <Link href={n.href}>
                <strong>{n.title}</strong>
              </Link>
              {!n.read_at && <Badge tone="green">Unread</Badge>}
            </div>
            <small>
              {new Date(n.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </small>
          </article>
        ))
      ) : (
        <Empty
          title="You’re all caught up"
          body="Project updates and new messages will appear here."
        />
      )}
    </>
  );
}
