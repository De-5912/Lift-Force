# Liftwork implementation

Liftwork is a Next.js App Router application backed by Supabase Auth, PostgreSQL, and Storage. Strict TypeScript, server components, server actions, Zod validation, row-level security, and transactional database commands keep identity and workflow rules consistent across the browser and database.

## System layout

- `src/app/` contains public pages, authenticated dashboards, server actions, the Auth callback, and signed document downloads.
- `src/components/` contains the marketplace, role-aware forms, profile directories, navigation, submissions, and shared UI primitives.
- `src/lib/domain.ts` defines lifecycle constants, TypeScript types, formatting helpers, and validation schemas.
- `src/lib/data.ts` centralizes server-only reads and request-scoped identity checks.
- `src/lib/supabase/` validates public configuration, supplies timeout-aware fetches, and creates cookie-based SSR clients.
- `src/proxy.ts` refreshes sessions when an Auth cookie exists and recovers when the configured Auth service is unavailable.
- `supabase/migrations/` defines the relational model, indexes, RLS policies, Storage buckets, notifications, and transactional workflow API.
- `supabase/seed.sql` and `scripts/generate-seed.ts` provide disposable local fixtures only.
- `tests/` exercises validation, authorization, and the real migration through PGlite.

## Data and authorization

Public profiles are separated from private accounts and organization data. Requirements contain relational role and skill lines. Individual applications and vendor proposals use separate tables; proposal items record the quantity offered for each role. Deployments and deployment items record final allocations. Conversations, messages, notifications, bookmarks, attachments, reviews, reports, and verification requests have dedicated tables.

All exposed tables use row-level security. Clients receive row-scoped read access and cannot directly mutate workflow tables. `public.run_command(jsonb)` is a security-invoker entry point into a private transactional implementation that rechecks the authenticated user, database-owned role, suspension state, ownership, eligibility, lifecycle state, and remaining capacity. Role claims from mutable Auth metadata are not trusted after account creation.

Selection locks the requirement and validates remaining quantities before creating deployment allocations. Duplicate submissions and reviews, over-allocation, cross-company reads, private site-address access, and unrelated conversation access are rejected by database rules as well as application checks.

## Authentication resilience

The first authentication implementation uses Supabase SSR cookies for registration, sign-in, password reset, callback exchange, sign-out, and protected routes. A later bug-fix layer validates both required environment variables and the URL, checks Auth health, applies request and action deadlines, catches callback and middleware failures, and guarantees the client pending state resets in `finally`.

When configuration is missing or the service cannot be reached, the account screen explains which variable or service needs attention. Middleware skips remote Auth work when no Auth cookie exists, which keeps public pages responsive during an outage.

## Hosted development environment

The configured hosted Supabase project has both migrations applied. A read-only verification query confirmed 30 public tables, the `run_command(jsonb)` API, RLS policies, and both expected Storage buckets. The web application needs only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Real environment files are ignored. The repository contains no hosted URL, API key, service-role credential, access token, or private key. The documented `Liftwork-Demo-2026!` password belongs only to disposable local seed users; none of those email addresses existed in hosted Auth at the publication audit.

## Delivery sequence

1. Project foundation and public information pages.
2. Database schema, reference taxonomy, local fixtures, and authorization tests.
3. Supabase SSR authentication, role guards, and outage recovery.
4. Profiles, history, public directories, media, and private documents.
5. Requirement discovery, publishing, ownership controls, and bookmarks.
6. Worker applications, vendor proposals, company review, deployments, and reviews.
7. Role dashboards, administration, messaging, and notifications.
8. Responsive polish, browser smoke coverage, documentation, and release checks.

## Verification gates

The completed source passes ESLint, strict TypeScript, the 17-test suite, and the Next.js production build. Hosted browser checks cover registration, sign-in, sign-out, protected-route redirects, all three onboarding paths, requirement publication, worker application, vendor proposal, and company applicant review. See `VERIFICATION.md` for the detailed record and remaining production-operational checks.
