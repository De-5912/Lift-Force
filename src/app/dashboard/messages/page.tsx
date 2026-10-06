import Link from "next/link";
import { requireUser } from "@/lib/data";
import { db } from "@/lib/supabase/server";
import { PageTitle, Empty, Field, Badge } from "@/components/ui";
import { ActionForm, CommandButton } from "@/components/action-form";
type Conversation = {
  id: string;
  job_id: string;
  company_id: string;
  applicant_id: string;
  jobs: { title: string };
  profiles: { name: string };
  conversation_participants: { user_id: string; last_read_at: string }[];
};
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; job?: string }>;
}) {
  const user = await requireUser(),
    query = await searchParams,
    client = await db();
  const { data, error } = await client
    .from("conversations")
    .select(
      "*,jobs(title),profiles!conversations_applicant_id_fkey(name),conversation_participants(user_id,last_read_at)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const conversations = data as unknown as Conversation[];
  const selected =
    conversations.find((c) => c.id === query.id) ??
    conversations.find((c) => c.job_id === query.job) ??
    conversations[0];
  const { data: messages, error: messageError } = await client
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (messageError) throw new Error(messageError.message);
  return (
    <>
      <PageTitle
        title="Project messages"
        description="Conversations are available after an application, proposal or vendor invitation."
      />
      {!selected ? (
        <Empty
          title="No conversations"
          body="Apply, invite a vendor or receive a submission to start a project conversation."
        />
      ) : (
        <div className="message-layout">
          <div className="conversation-list">
            {conversations.map((c) => {
              const last =
                c.conversation_participants.find((p) => p.user_id === user.id)
                  ?.last_read_at ?? "";
              const unread = messages.filter(
                (m) =>
                  m.conversation_id === c.id &&
                  m.sender_id !== user.id &&
                  m.created_at > last,
              ).length;
              return (
                <Link
                  key={c.id}
                  className="conversation-link"
                  href={`/dashboard/messages?id=${c.id}`}
                >
                  <strong>{c.jobs.title}</strong>
                  {c.profiles.name}{" "}
                  {unread > 0 && <Badge tone="green">{unread} unread</Badge>}
                </Link>
              );
            })}
          </div>
          <div className="panel">
            <h2>{selected.jobs.title}</h2>
            <CommandButton
              op="read_conversation"
              values={{ id: selected.id }}
              label="Mark as read"
            />
            <div className="message-list">
              {messages
                .filter((m) => m.conversation_id === selected.id)
                .map((m) => (
                  <article
                    className={`message ${m.sender_id === user.id ? "mine" : ""}`}
                    key={m.id}
                  >
                    <p>{m.body}</p>
                    <small>
                      {m.sender_id === user.id
                        ? "You"
                        : m.sender_id === selected.company_id
                          ? "Company"
                          : selected.profiles.name}{" "}
                      ·{" "}
                      {new Date(m.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </small>
                  </article>
                ))}
            </div>
            <ActionForm
              op="message"
              values={{ conversation_id: selected.id }}
              submit="Send message"
            >
              <Field label="Message">
                <textarea
                  name="body"
                  required
                  maxLength={5000}
                  placeholder="Discuss scope, availability or mobilization…"
                />
              </Field>
            </ActionForm>
            <p>
              <small>
                <Link href={`/dashboard/documents?job=${selected.job_id}`}>
                  View shared project documents →
                </Link>
              </small>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
