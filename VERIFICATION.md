# Verification record

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
