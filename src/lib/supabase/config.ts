export const SUPABASE_REQUEST_TIMEOUT_MS = 8_000;
export const SUPABASE_HEALTH_TIMEOUT_MS = 2_500;
export const AUTH_ACTION_TIMEOUT_MS = 12_000;

type Environment = Record<string, string | undefined>;

export type SupabaseConfiguration =
  | { ok: true; url: string; key: string; local: boolean }
  | { ok: false; message: string };

export class SupabaseRequestTimeoutError extends Error {
  constructor(timeoutMs: number, cause?: unknown) {
    super(`The Supabase request timed out after ${timeoutMs} ms.`, { cause });
    this.name = "SupabaseRequestTimeoutError";
  }
}

export function isLocalSupabaseUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export function getSupabaseConfiguration(
  environment: Environment = process.env,
): SupabaseConfiguration {
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [
    !rawUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean) as string[];

  if (missing.length) {
    return {
      ok: false,
      message: `Authentication is not configured. Add ${missing.join(
        " and ",
      )} to .env.local, then restart the application.`,
    };
  }

  let url: URL;
  try {
    url = new URL(rawUrl!);
  } catch {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Correct it in .env.local, then restart the application.",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_URL must begin with http:// or https://. Correct it in .env.local, then restart the application.",
    };
  }

  const normalizedUrl = url.toString().replace(/\/$/, "");
  return {
    ok: true,
    url: normalizedUrl,
    key: key!,
    local: isLocalSupabaseUrl(normalizedUrl),
  };
}

export function unavailableSupabaseMessage(url: string) {
  if (isLocalSupabaseUrl(url)) {
    return `Authentication is configured for local Supabase at ${url}, but that service is not running. Start Docker Desktop and run \`pnpm exec supabase start\`, or replace the local values in .env.local with credentials for an available Supabase project. Then restart the application.`;
  }

  return `The configured Supabase authentication service at ${url} could not be reached. Check NEXT_PUBLIC_SUPABASE_URL, network access, and the project's status, then try again.`;
}

function errorDetails(error: unknown) {
  if (!(error && typeof error === "object"))
    return { message: String(error ?? ""), name: "", status: undefined };
  const value = error as {
    message?: unknown;
    name?: unknown;
    status?: unknown;
  };
  return {
    message: typeof value.message === "string" ? value.message : "",
    name: typeof value.name === "string" ? value.name : "",
    status: typeof value.status === "number" ? value.status : undefined,
  };
}

export function isAuthNetworkError(error: unknown) {
  const { message, name, status } = errorDetails(error);
  const signature = `${name} ${message}`.toLowerCase();
  return (
    status === 0 ||
    /(fetch|network|abort|timeout|timed out|econnrefused|enotfound)/.test(
      signature,
    )
  );
}

export function authErrorMessage(error: unknown) {
  const { message } = errorDetails(error);

  if (isAuthNetworkError(error)) {
    const configuration = getSupabaseConfiguration();
    return configuration.ok
      ? unavailableSupabaseMessage(configuration.url)
      : configuration.message;
  }

  return message || "Authentication failed. Please try again.";
}

export function createTimedFetch(
  timeoutMs: number,
  implementation: typeof fetch = globalThis.fetch,
): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    let timedOut = false;
    const sourceSignals = [
      init?.signal,
      input instanceof Request ? input.signal : undefined,
    ].filter(Boolean) as AbortSignal[];
    const abortFromSource = (signal: AbortSignal) =>
      controller.abort(signal.reason);
    const listeners = sourceSignals.map((signal) => {
      const listener = () => abortFromSource(signal);
      if (signal.aborted) abortFromSource(signal);
      else signal.addEventListener("abort", listener, { once: true });
      return { signal, listener };
    });
    let rejectDeadline: (
      reason: SupabaseRequestTimeoutError,
    ) => void = () => {};
    const deadline = new Promise<never>((_, reject) => {
      rejectDeadline = reject;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      rejectDeadline(new SupabaseRequestTimeoutError(timeoutMs));
    }, timeoutMs);

    try {
      const request = implementation(input, {
        ...init,
        signal: controller.signal,
      });
      return await Promise.race([request, deadline]);
    } catch (error) {
      if (error instanceof SupabaseRequestTimeoutError) throw error;
      if (timedOut) throw new SupabaseRequestTimeoutError(timeoutMs, error);
      throw error;
    } finally {
      clearTimeout(timer);
      listeners.forEach(({ signal, listener }) =>
        signal.removeEventListener("abort", listener),
      );
    }
  };
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
