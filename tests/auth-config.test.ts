import test from "node:test";
import assert from "node:assert/strict";
import {
  createTimedFetch,
  getSupabaseConfiguration,
  isLocalSupabaseUrl,
  SupabaseRequestTimeoutError,
  unavailableSupabaseMessage,
  withTimeout,
} from "../src/lib/supabase/config";

test("Supabase configuration names every missing environment variable", () => {
  const configuration = getSupabaseConfiguration({});
  assert.equal(configuration.ok, false);
  if (!configuration.ok) {
    assert.match(configuration.message, /NEXT_PUBLIC_SUPABASE_URL/);
    assert.match(configuration.message, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  }
});

test("Supabase configuration rejects invalid URLs and recognizes local services", () => {
  const invalid = getSupabaseConfiguration({
    NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  });
  assert.equal(invalid.ok, false);
  assert.equal(isLocalSupabaseUrl("http://127.0.0.1:54321"), true);
  assert.equal(isLocalSupabaseUrl("https://project.supabase.co"), false);
  assert.match(
    unavailableSupabaseMessage("http://127.0.0.1:54321"),
    /pnpm exec supabase start/,
  );
});

test("Supabase fetches reject at their deadline", async () => {
  const neverFetch = (() => new Promise<Response>(() => {})) as typeof fetch;
  const timedFetch = createTimedFetch(20, neverFetch);
  await assert.rejects(
    timedFetch("http://127.0.0.1:54321/auth/v1/health"),
    SupabaseRequestTimeoutError,
  );
});

test("client operations reject at their deadline", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 20, "Operation timed out."),
    /Operation timed out/,
  );
});
