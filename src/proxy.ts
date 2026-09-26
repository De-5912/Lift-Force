import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  createTimedFetch,
  getSupabaseConfiguration,
  SUPABASE_HEALTH_TIMEOUT_MS,
} from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const configuration = getSupabaseConfiguration();
  if (!configuration.ok) return response;
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => /-auth-token(?:\.\d+)?$/.test(name));
  if (!hasAuthCookie) return response;
  const client = createServerClient(configuration.url, configuration.key, {
    global: { fetch: createTimedFetch(SUPABASE_HEALTH_TIMEOUT_MS) },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  try {
    await client.auth.getClaims();
  } catch {
    // Let the route render so it can report an unavailable Auth service.
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
