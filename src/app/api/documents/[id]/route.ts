import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { currentUser } from "@/lib/data";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Sign in required", { status: 401 });
  const { id } = await params;
  const client = await db();
  const { data, error } = await client
    .from("attachments")
    .select("object_path,name")
    .eq("id", id)
    .maybeSingle();
  if (error || !data)
    return new NextResponse("Document not found", { status: 404 });
  const { data: link, error: linkError } = await client.storage
    .from("documents")
    .createSignedUrl(data.object_path, 60, { download: data.name });
  if (linkError)
    return new NextResponse("Unable to open document", { status: 500 });
  return NextResponse.redirect(link.signedUrl, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
