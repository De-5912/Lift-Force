import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next");
  const next =
    requested === "/reset-password" ? requested : "/dashboard/profile";
  if (!code)
    return NextResponse.redirect(new URL("/sign-in", request.url));
  const client = await db();
  const { error } = await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(
    new URL(error ? "/sign-in" : next, request.url),
  );
}
