# Liftwork

A project manpower marketplace for the elevator industry in India. Companies publish multi-role requirements; individual professionals apply for one role; vendors quote for a complete or partial team. Selection allocates manpower, followed by deployment confirmation, completion and mutual reviews.

## Live deployment

- **Production URL:** [lift-force.vercel.app](https://lift-force.vercel.app)
- **Hosting:** Vercel running Next.js, with hosted Supabase for PostgreSQL, Auth and Storage.
- **Production branch:** `main` in `De-5912/Lift-Force`.
- **CI:** GitHub Actions.
- **Status:** deployed and usable; production application verification is complete, including the October 2026 Available Manpower marketplace.
- **Remaining readiness item:** custom SMTP. Supabase still uses its restricted built-in email sender. Confirmation/reset email delivery for arbitrary public users is not yet considered production-ready; configure custom SMTP before relying on public registration at scale.
- **Custom domain:** optional; none has been chosen.

The hosted backend has all four migrations, 35 public tables with RLS enabled, and `public.run_command(jsonb)` for transactional workflow operations. Storage uses public `profile-media` for profile images and private `documents` for authorized downloads. Confirm Email is enabled; the Auth Site URL is `https://lift-force.vercel.app`, with production confirmation/reset callbacks configured and localhost/127.0.0.1 development callbacks preserved.

All production checks passed locally and in GitHub Actions:

```sh
pnpm install --frozen-lockfile
pnpm test                     # 22 tests
pnpm lint
pnpm typecheck
pnpm build
```

The web application uses only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`; no Supabase service-role key is used. See [VERIFICATION.md](VERIFICATION.md) for the executed checks and email-delivery limitation.

Development retains an explicitly labelled read-only preview when Supabase is not configured; preview pages never pretend to persist accounts or business records. Earlier hosted development checks covered company/worker/vendor registration and onboarding, worker applications, vendor proposals and company applicant review. Current production workflow checks used administrator-provisioned disposable accounts with email confirmation enabled; they do not establish public confirmation/reset email delivery.

## Features implemented

- Vendors publish multi-role Available Manpower listings, manage availability, and receive company invitations. Companies filter listings and invite vendors to their own open requirements; existing proposal, review, messaging and notification workflows take over.
- Email/password registration, sign-in, confirmation callback, reset password and sign-out through Supabase Auth. Company, worker and vendor self-registration; trusted admin provisioning only.
- Editable profiles, public photos/logos, manpower categories, industry skills, availability, rates, private company contact/GST fields and private document uploads. Employment, projects, certifications, training and education use structured history entries.
- Database-managed elevator categories, manpower roles and skills, ready for additional industries.
- Multi-role requirements with site privacy, project/elevator types and unit counts, schedule, role-specific skills/certifications/budgets, compensation, overtime, facilities, safety instructions, team-size limits, publication controls and duplication.
- Public discovery, requirement details, worker and vendor directories; keyword, city, category, role, experience, start date, duration, rate and facilities filters.
- Distinct individual applications and vendor proposals; per-role quantities, partial proposals, mobilization and quotation terms.
- Company comparison, review, shortlist, interview/negotiation, rejection and selection; individual/vendor withdrawal.
- Transactional capacity checks. Selection locks the requirement, validates remaining quantities and creates deployment allocations in the same transaction.
- Deployment confirmation/completion and one mutual review per completed engagement participant.
- Participant-only conversations, unread counts, notifications, saved requirements and private document sharing.
- Manual verification, reports, account suspension, listing deactivation and taxonomy administration.
- Mobile navigation, collapsible phone filters, loading/empty/error states and labelled forms.

### Available Manpower marketplace

Available Manpower adds supply-side discovery alongside company-posted requirements. A listing advertises a vendor's team capacity, rather than one individual employee, and can contain multiple worker roles and quantities.

1. **Vendor:** creates a listing, describes availability and capabilities, manages listing status (including pause/reactivation), and receives invitations from companies.
2. **Company:** browses and filters available manpower, opens a vendor's listing, and invites the vendor to an existing open requirement owned by that company.
3. **Vendor:** receives the invitation/notification, reviews the requirement, and submits through the existing vendor proposal workflow.
4. **Company:** reviews, shortlists and accepts the proposal through the existing application flow.

Browse listings at `/manpower`; vendors manage their listings at `/dashboard/manpower`, and both sides track invitations at `/dashboard/invitations`. Listings reuse the existing roles, categories, skills, vendor profiles, notifications and participant-scoped messaging. There is no separate quotation or messaging system.

## Architecture

```text
src/app/                 App Router pages, server actions and download/callback routes
src/components/          Reusable forms, marketplace, navigation and UI primitives
src/lib/domain.ts        Types, lifecycle constants and Zod validation
src/lib/data.ts          Server-only reads with request-scoped identity
src/lib/supabase/        Cookie-based Supabase server client
src/proxy.ts             Session refresh with verified user lookup
supabase/migrations/     Relational model, RLS, transactional workflow commands
supabase/seed.sql        Local-only demo accounts, taxonomies and projects
scripts/                 Seed generator and public browser smoke checks
tests/                   Validation and PostgreSQL authorization/workflow tests
artifacts/               Browser screenshots
```

Next.js 16 App Router, React, strict TypeScript, Tailwind CSS and accessible semantic controls. Hosted Supabase provides PostgreSQL, Auth and Storage with public profile images and private documents. Dependencies are pinned in `package.json`, with a pnpm lockfile. PGlite is used only in automated SQL tests; it is not an application database or an auth replacement.

### Database model

Public profiles are separated from authorization accounts and private organization data. Requirements contain relational manpower and skill lines. Available Manpower listings contain normalized role/quantity items and category/skill relations; invitations link a company, vendor, listing and existing requirement. Applications and proposals are separate tables; proposal items represent each offered role. Deployments and deployment items record allocations. Conversations, participants, messages, notifications, verification requests, reviews, reports, attachments and bookmarks have separate tables.

UUID primary/foreign keys, restrictive deletion for engagement history, enums for stable lifecycle states, editable taxonomy tables, check constraints and indexes enforce data structure. Core domain names are industry-neutral.

### Authorization

All exposed tables have RLS. Clients have SELECT access under row-specific policies and no direct table mutation grants. A small public SECURITY INVOKER command wrapper calls a private transactional service. Its privileged implementation checks `auth.uid()`, a database-owned account role, suspension, ownership, eligibility and state on every operation. Definer helpers use an empty search path and explicit grants; internal trigger/notification helpers are not client-callable.

Role claims in mutable Auth user metadata are never used for ongoing authorization. Signup accepts a closed non-admin role allowlist once, then stores the role in `accounts`. Admin promotion requires trusted SQL.

Next.js server actions add validation and their built-in origin/CSRF protection; the database independently enforces critical invariants against direct RPC calls. A per-user database command limit complements Supabase Auth limits. Uploads enforce a 5 MB limit, MIME allowlist and magic-byte checks. Profile images use public profile-media; documents remain private and authorized downloads use 60-second signed URLs. Uploads do not yet include a malware-scanning service.

## Development setup

Prerequisites: Node.js 22.9+ (Node 24 tested) and pnpm 11+. Chrome is needed for browser smoke checks. Docker is optional and only needed when deliberately running a disposable local Supabase stack.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Copy `.env.example` to `.env.local` and add the hosted project's public client settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No service-role key is needed by the web application. `.env.local` and all other real environment files are ignored by Git. Never place a service-role key or another secret in a `NEXT_PUBLIC_` variable. Restart Next.js after changing the environment.

Open [the local application](http://localhost:3000). Without Supabase environment values, public pages show sample data and account forms explain what configuration is missing. No anonymous account simulation or browser storage is used for business records.

`agentRules: false` prevents Next.js from rewriting the existing read-only project instruction file. Files under `sources/` are untouched reference material.

### Hosted Supabase schema

Apply the files in `supabase/migrations/` to a hosted project in filename order. Do not apply `supabase/seed.sql` to a hosted or production project. Configure the Auth site URL and allow these callback destinations for the environment:

- `/auth/callback`
- `/auth/callback?next=/reset-password`

Keep the `documents` bucket private. The migration creates `profile-media` for public profile images and `documents` for private signed downloads.

### Optional disposable local Supabase

Start Docker Desktop first, then:

```sh
pnpm exec supabase start
pnpm exec supabase status
```

The first local start applies migrations and `supabase/seed.sql`. To recreate this **disposable local database**, use:

```sh
pnpm exec supabase db reset --local
```

Reset deletes the local database contents. Never use demo seeds in production. Do not run a remote reset.

Use the local API URL and publishable/anon key reported by `supabase status`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-or-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The local config allows the callback and reset routes on localhost and 127.0.0.1. Local email confirmation is enabled: use the local mail viewer URL from `supabase status` to open registration and reset messages. Seeded demo accounts are already confirmed.

### Seed data and test accounts

Run `pnpm seed:generate` after modifying the typed sample catalogue. Then reset the disposable local database to load the generated SQL.

All local demo accounts use **`Liftwork-Demo-2026!`**. These are public development credentials, not secrets, and must never be provisioned on a public deployment. Before this repository was published, the hosted project's Auth users were checked and none of the seven demo email addresses existed there.

| Email | Account |
| --- | --- |
| company@liftwork.test | Apex Elevators company owner |
| company2@liftwork.test | Summit Lift Systems company owner |
| worker@liftwork.test | Arjun Kumar, individual worker |
| worker2@liftwork.test | Priya Sharma, individual worker |
| vendor@liftwork.test | Vertex Lift Manpower Services |
| vendor2@liftwork.test | Precision Elevator Workforce |
| admin@liftwork.test | Local platform administrator |

Seed requirements use October 2026 dates from the brief; update their dates if running after their deadlines. Companies initially own their organizations; the member table supports future company team permissions without changing account ownership.

## Commands

```sh
pnpm dev                 # Local development preview
pnpm typecheck           # Strict TypeScript
pnpm lint                # ESLint
pnpm test                # Validation and real PostgreSQL workflow/RLS tests
pnpm build               # Production build
pnpm start               # Serve the production build
pnpm seed:generate       # Recreate local SQL seed
pnpm test:browser        # Public browser smoke checks against 127.0.0.1:3000
pnpm format              # Format maintained application files
```

The automated suite currently has 22 tests. SQL tests supply minimal Auth/Storage schema fixtures and execute the actual workflow migrations. Coverage includes manpower listing validation, quantities, filtering, ownership/status visibility, requirement ownership, invitations/duplicate prevention, selection rollback, role spoofing, duplicate submissions/reviews, company IDOR, private addresses/messages, verification, reports and suspension. It does not substitute for testing the Supabase services themselves or true multi-session concurrency.

## Signed-in acceptance coverage

Live production verification successfully covered:

- Public pages and desktop/mobile rendering.
- Company requirement creation.
- Vendor multi-role manpower listing creation and listing pause/reactivation.
- Marketplace filtering and company invitation to an existing requirement.
- Vendor notification and normal proposal submission.
- Company proposal review and shortlist.
- Sign-out and subsequent sign-in, including protected-route recovery.

The mobile sign-out issue discovered during verification was fixed. Disposable production verification accounts and data were removed after testing; pre-existing hosted data was preserved. Proposal acceptance remains part of the existing application workflow and automated database coverage; the live verification above ended at shortlist. Real confirmation/reset email delivery remains subject to the SMTP limitation.

For future releases, use the following broader regression checklist in an isolated staging environment:

1. Register each account type; confirm email, reset a password and verify logout/protected routes.
2. Company: complete profile → publish multi-role requirement → receive worker and partial vendor responses → compare → shortlist → message → select → verify filled counts → confirm deployments → complete → review.
3. Worker: profile and skills → filter work → apply → upload resume linked to the requirement → track status → receive messages → deployment → completion → review company.
4. Vendor: profile → publish/manage available manpower → receive company invitation → submit a normal proposal with partial manpower quantities and rate → negotiation → acceptance → deployment → completion → review.
5. Admin: login → inspect verification documents → approve/reject → review report → suspend account/deactivate listing → edit taxonomy.
6. With a second company, attempt to access private submissions/documents/messages through changed URLs and direct RPC requests; verify denial. Test file downloads and expiry, not only upload UI.
7. Repeat main forms on a phone and keyboard, including error recovery. Test simultaneous selections from two separate database sessions.

See `VERIFICATION.md` for the executed hosted, browser, database, and build checks.

## Deployment to Vercel

The Next.js project uses Node 24, pnpm 11.19.0, and the committed lockfile. Vercel production variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`; no service-role key is required. The canonical site URL is `https://lift-force.vercel.app`. GitHub Actions checks frozen installation, 22 tests, lint, TypeScript and the production build without hosted credentials.

All four migrations are applied in the current hosted project. Migration order for a new environment (never run the local seed against hosted data):

1. `20260926071705_workforce_core.sql`
2. `20260926090000_reference_catalog.sql`
3. `20261006141245_available_manpower_marketplace.sql`
4. `20261006143013_manpower_invitation_listing_index.sql`

The connected hosted project contains these exact migration contents, recorded under connector-generated timestamps. Confirm Email is enabled. The Auth Site URL is `https://lift-force.vercel.app`; these production callbacks are allowlisted alongside localhost/127.0.0.1 development callbacks:

- `https://lift-force.vercel.app/auth/callback`
- `https://lift-force.vercel.app/auth/callback?next=/reset-password`

### Remaining email setup

Custom SMTP is not complete. Supabase's restricted built-in sender is still in use, and confirmation/reset delivery for arbitrary public users is not yet production-ready. Configure a transactional SMTP provider with a verified sender before relying on public registration at scale. Required settings are SMTP host, port, username, password/API credential, sender email and sender display name; domain verification requires the provider's exact DNS records. Keep credentials out of source control and verify real confirmation/reset emails after configuration.

A custom application domain is optional and has not been chosen. If one is added, update `NEXT_PUBLIC_SITE_URL`, the Supabase Auth Site URL and callback allowlist together.

For another deployment:

1. Create an isolated Supabase project and apply the migrations in order after review. Do **not** apply `seed.sql`. Review database/security advisors.
2. Provision an initial administrator through a trusted database session after registering a normal account: update `accounts.role` and `profiles.kind` together to `ADMIN` for that exact user UUID. Do not add a public promotion API.
3. Configure Supabase email delivery, confirmation, password reset redirects, abuse controls and production site URL. Keep the documents bucket private.
4. Import the repository into Vercel as a Next.js project. Set the three environment variables above for the chosen environment, with the production site URL. Build with `pnpm build`.
5. Add `https://your-domain/auth/callback` and `https://your-domain/auth/callback?next=/reset-password` to permitted Auth redirects. Run the complete signed-in acceptance checks on an isolated staging environment before promotion.
6. Configure backups, retention, support contact, incident handling and file malware scanning appropriate to the actual operation.

## Scope still requiring implementation or expansion

The supplied code covers the central P0 workflow and the main P1 operations. Certifications are supplied and reviewed manually; closest-match sorting uses shared skills and city, never an automatic hiring decision. Disputes use the report/moderation workflow; a dedicated dispute-resolution case system remains future work. Contact support is explicitly unconfigured; no invented email address is shown. Automatic email/SMS/WhatsApp delivery beyond Supabase authentication is not enabled.

Payments, attendance, contracts, invoices, payroll, escrow, GPS, mobile apps and external WhatsApp/SMS delivery remain P2, as requested. The deployed application persists business records in hosted Supabase; the unconfigured local preview remains read-only.
