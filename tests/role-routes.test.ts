import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Execute the real server modules with deterministic Auth/DB/Next adapters.
// Database authorization is tested separately against PostgreSQL, not mocked here.
function load<T>(path: string, dependencies: Record<string, unknown>): T {
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  runInNewContext(output, {
    exports,
    require: (name: string) => {
      if (name in dependencies) return dependencies[name];
      if (name === "react/jsx-runtime")
        return { jsx: () => ({}), jsxs: () => ({}) };
      if (
        name.startsWith("@/components/") ||
        name === "lucide-react" ||
        name === "next/link" ||
        name === "@/lib/domain"
      )
        return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
    Date,
    Error,
  });
  return exports as T;
}

function fixture(role: string | null) {
  const queries: { table: string; filters: [string, unknown][] }[] = [];
  const navigation = {
    redirect: (url: string) => {
      throw new Error(`redirect:${url}`);
    },
    notFound: () => {
      throw new Error("not-found");
    },
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: role ? { id: "company-a" } : null },
      }),
    },
    from: (table: string) => {
      const query = { table, filters: [] as [string, unknown][] };
      queries.push(query);
      const builder = {
        select: () => builder,
        eq: (key: string, value: unknown) => {
          query.filters.push([key, value]);
          return builder;
        },
        gte: (key: string, value: unknown) => {
          query.filters.push([key, value]);
          return builder;
        },
        single: async () => ({ data: { role, suspended: false }, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: async () => ({ data: [], error: null }),
      };
      return builder;
    },
  };
  const data = load<typeof import("../src/lib/data")>("src/lib/data.ts", {
    "server-only": {},
    react: { cache: (fn: unknown) => fn },
    "next/navigation": navigation,
    "./supabase/server": { configured: () => true, db: async () => client },
    "./demo": {},
  });
  const route = (path: string) =>
    load<{
      default: (props: { params: Promise<{ id: string }> }) => Promise<unknown>;
    }>(path, {
      "@/lib/data": data,
      "next/navigation": navigation,
    }).default({ params: Promise.resolve({ id: "competitor-job" }) });
  return { data, queries, route };
}

test("anonymous marketplace and direct detail/apply routes require sign-in before querying jobs", async () => {
  for (const path of [
    "src/app/requirements/page.tsx",
    "src/app/requirements/[id]/page.tsx",
    "src/app/requirements/[id]/apply/page.tsx",
  ]) {
    const f = fixture(null);
    await assert.rejects(f.route(path), /redirect:\/sign-in/);
    assert.equal(
      f.queries.some((q) => q.table === "jobs"),
      false,
    );
    assert.equal((await f.data.getMarketplaceJobs()).length, 0);
  }
});

test("company marketplace and apply routes are denied; competitor detail is ownership-scoped and not found", async () => {
  const f = fixture("COMPANY");
  await assert.rejects(
    f.route("src/app/requirements/page.tsx"),
    /redirect:\/dashboard\/requirements/,
  );
  await assert.rejects(
    f.route("src/app/requirements/[id]/apply/page.tsx"),
    /redirect:\/dashboard/,
  );
  assert.equal(
    f.queries.some((q) => q.table === "jobs"),
    false,
  );
  await assert.rejects(
    f.route("src/app/requirements/[id]/page.tsx"),
    /not-found/,
  );
  assert.deepEqual(f.queries.find((q) => q.table === "jobs")?.filters, [
    ["id", "competitor-job"],
    ["owner_id", "company-a"],
  ]);
  await f.data.getOwnedJobs();
  assert.deepEqual(f.queries.at(-1)?.filters, [["owner_id", "company-a"]]);
  assert.equal((await f.data.getMarketplaceJobs()).length, 0);
});

test("worker vendor and admin marketplace queries remain open/deadline scoped", async () => {
  for (const role of ["WORKER", "VENDOR", "ADMIN"]) {
    const f = fixture(role);
    assert.equal((await f.data.requireMarketplaceUser()).role, role);
    await f.data.getMarketplaceJobs();
    assert.deepEqual(f.queries.at(-1)?.filters, [
      ["status", "OPEN"],
      ["deadline", new Date().toISOString().slice(0, 10)],
    ]);
    await f.data.getVisibleJob("history-job");
    assert.deepEqual(f.queries.at(-1)?.filters, [["id", "history-job"]]);
  }
});
