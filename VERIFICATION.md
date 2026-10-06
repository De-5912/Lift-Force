# Verification record

## Production verification — 6 October 2026

Production URL: https://lift-force.vercel.app. Vercel hosts Next.js from `De-5912/Lift-Force`, with `main` as the production branch. Node 24/pnpm 11.19.0 use the frozen lockfile. GitHub Actions runs tests, lint, TypeScript and build without hosted credentials.

- Frozen installation, **22 tests**, lint, TypeScript and production build passed.
- Environment names configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. No service-role key is used. Only `.env.example` is tracked; no secret-key/private-key patterns were found in Git history.
- All 35 public tables have RLS. `public.run_command(jsonb)` exists. Storage has public `profile-media`, private `documents`, and the intended upload/private-read policies. No local seed users exist on hosted Auth.
- Confirm email is enabled. Site URL is `https://lift-force.vercel.app`; confirmation/reset callbacks are allowlisted alongside preserved development callbacks.
- Live company sign-in, requirement publication, sign-out/protected redirects, and subsequent sign-in passed.
- Live vendor creation of a two-role 14-person listing, pause/reactivate, company city/capacity/travel filtering and listing detail passed.
- Company invitation created a vendor notification. Vendor submitted through the existing proposal form; invitation became `PROPOSAL_SUBMITTED`, company received notification, reviewed and shortlisted the proposal.
- Mobile testing exposed hidden sign-out; it is now available in mobile navigation.
- Live `/`, `/requirements`, `/manpower`, `/workers`, `/vendors`, `/about`, `/how-it-works`, `/contact`, and `/sign-in` returned HTTP 200 with real page content. No framework errors, configuration warnings, localhost links, broken images, failed asset responses or browser console/page errors were observed. Desktop and mobile manpower pages had no horizontal overflow.
- Disposable test users, requirement, listing, proposal, invitation, notifications and associated conversation were removed after verification; the follow-up database counts are zero.

All four migrations were already applied. Each hosted stored migration matches the corresponding repository file after whitespace normalization; connector-generated versions differ from filenames:

| Repository file | Hosted version |
| --- | --- |
| `20260926071705_workforce_core.sql` | `20260926095717` |
| `20260926090000_reference_catalog.sql` | `20260926095729` |
| `20261006141245_available_manpower_marketplace.sql` | `20261006142927` |
| `20261006143013_manpower_invitation_listing_index.sql` | `20261006143040` |

No reset, hosted seed or migration replay was performed. Authenticated verification used only administrator-provisioned disposable accounts, with global confirmation enabled. This tests sign-in and application workflows but **does not prove email confirmation delivery**. Only records created specifically for this verification may be removed.

### Remaining production email task

Custom SMTP is disabled; Supabase still uses its restricted/rate-limited built-in sender. No connected SMTP credentials are available. Real confirmation/reset email delivery remains unverified; general-public registration is not yet production-ready. See [Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

Provide a transactional SMTP account (for example Resend, Postmark or Amazon SES), SMTP host, port, username, password/API credential, verified sender email and sender display name through a secure channel. Add that provider's exact SPF/DKIM verification records to the sender domain's DNS and DMARC if required. DNS values must come from the provider. Configure Supabase custom SMTP, then verify real confirmation/reset email links. A custom application domain is optional; the Vercel URL already works.

Security advisor has no table/RLS findings but reports leaked-password protection disabled; see [password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Backups, monitoring, document malware scanning and true multi-session contention remain operational considerations.

## Historical development verification — 26 September 2026

Verification was completed on 26 September 2026 against the finished local source and the configured hosted Supabase development project. No service-role credential or other hosted secret is stored in the repository.

## Hosted Supabase

- Applied migrations: `workforce_core` and `reference_catalog`.
- Read-only schema audit: 30 public tables, `public.run_command(jsonb)`, public-schema RLS policies, and both expected Storage buckets are present.
- Supabase security advisor: no findings.
- Supabase performance advisor: informational missing-index findings and RLS initialization-plan warnings remain for future workload tuning. They do not disable RLS or block the tested workflows.
- Hosted Auth audit: none of the seven documented `@liftwork.test` local seed users exists in `auth.users`; the published `Liftwork-Demo-2026!` seed password is therefore not usable against the hosted project.

## Hosted account and workflow checks

The following browser journeys completed against hosted Supabase:

- Registration and sign-in for company, worker, and vendor accounts.
- Sign-out and protected dashboard redirects.
- Company, worker, and vendor profile onboarding.
- Company creation and publication of a multi-role requirement.
- Worker submission of an individual application.
- Vendor submission of a partial manpower proposal.
- Company applicant/proposal listing, comparison, and status review.
- Auth callback error handling and visible recovery from unavailable or invalid configuration.

The client submit state resets through `finally`; request and action deadlines prevent unavailable Auth services from leaving sign-in or registration pending indefinitely.

## Automated checks

- ESLint: passed with no warnings or errors.
- Strict TypeScript: passed.
- Next.js 16 production build: passed; the complete application route manifest and Auth proxy compiled.
- Automated suite: 17 tests passed.
  - Four Supabase configuration, URL, fetch-deadline, and client-operation deadline tests.
  - Nine PostgreSQL workflow and authorization scenarios plus their parent suite.
  - Three domain validation/allocation tests.
- Database coverage includes duplicate submissions and reviews, role spoofing, company IDOR, direct table mutation denial, selection rollback, over-allocation, private site addresses, participant-scoped conversations, professional-history ownership, vendor team limits, private attachment isolation, verification, reports, suspension, requirement closure, deployment completion, and mutual reviews.

## Public and responsive browser checks

- Public pages were exercised at 390, 768, and 1440 pixel widths.
- No horizontal overflow, blank pages, framework overlays, or browser console errors appeared on the checked routes.
- Marketplace city filtering, no-results state, filter clearing, and the mobile filter disclosure passed.
- Unauthenticated dashboard navigation redirected to sign-in.

## Production-release checks still required

- Configure the production site URL and exact Auth redirect allowlist after the final domain is known.
- Verify production SMTP delivery, sender reputation, email templates, and reset/confirmation links.
- Re-run all signed-in journeys in an isolated staging deployment using production-like environment settings.
- Exercise simultaneous selection from independent live database sessions under realistic contention.
- Review the Supabase performance-advisor findings against real query plans and traffic before adding indexes or rewriting policies.
- Configure backups, retention, monitoring, incident response, support ownership, and malware scanning for uploaded documents.

These remaining items are deployment and operations work; they do not require local Docker and do not change the completed application flow.
