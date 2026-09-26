import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createTimedFetch,
  getSupabaseConfiguration,
  SUPABASE_HEALTH_TIMEOUT_MS,
  SUPABASE_REQUEST_TIMEOUT_MS,
  unavailableSupabaseMessage,
} from "./config";

const supabaseFetch = createTimedFetch(SUPABASE_REQUEST_TIMEOUT_MS);

export const configured = () => getSupabaseConfiguration().ok;

export async function getAuthAvailability(): Promise<{
  enabled: boolean;
  message?: string;
}> {
  const configuration = getSupabaseConfiguration();
  if (!configuration.ok)
    return { enabled: false, message: configuration.message };

  try {
    const response = await createTimedFetch(SUPABASE_HEALTH_TIMEOUT_MS)(
      `${configuration.url}/auth/v1/health`,
      {
        cache: "no-store",
        headers: { apikey: configuration.key },
      },
    );
    if (response.ok) return { enabled: true };
    if (response.status === 401 || response.status === 403)
      return {
        enabled: false,
        message:
          "The Supabase service rejected NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Replace it with the project's publishable or anon key in .env.local, then restart the application.",
      };
    return {
      enabled: false,
      message: `Supabase Auth at ${configuration.url} returned HTTP ${response.status}. Check NEXT_PUBLIC_SUPABASE_URL and the project's Auth service, then try again.`,
    };
  } catch {
    return {
      enabled: false,
      message: unavailableSupabaseMessage(configuration.url),
    };
  }
}

export async function db() {
  const configuration = getSupabaseConfiguration();
  if (!configuration.ok) throw new Error(configuration.message);
  const jar = await cookies();
  return createServerClient(configuration.url, configuration.key, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Read-only Server Component; proxy persists refreshed cookies. */
        }
      },
    },
  });
}
