import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase/server";
import { isAuthNetworkError } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next");
  const next =
    requested === "/reset-password" ? requested : "/dashboard/profile";
  if (!code)
    return NextResponse.redirect(
      new URL("/sign-in?error=missing-code", request.url),
    );
  try {
    const client = await db();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    return NextResponse.redirect(
      new URL(
        isAuthNetworkError(error)
          ? "/sign-in?error=unavailable"
          : "/sign-in?error=confirmation",
        request.url,
      ),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/sign-in?error=unavailable", request.url),
    );
  }
}
