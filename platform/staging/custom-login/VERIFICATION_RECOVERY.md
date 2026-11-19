# Staging verification recovery — 2026-11-19

Scope: custom staging authentication only. No production, billing, provider permissions or D1 schema changes.

Observed failure: registration verification requests were rejected during the sealed browser-flow read, before provider code validation. The UI mislabeled all failures as invalid codes. Registration context started a 30-minute lifetime before account creation; delayed SMTP setup exhausted that flow. Live logs cannot distinguish expiry from missing/invalid cookies. The affected staging test identity remained email-unverified; its latest password check succeeded, but sign-in correctly failed closed on the unverified account policy.

Changes:
- Fixed response codes for missing/expired flow (401 SESSION_EXPIRED), invalid/expired provider code (400 INVALID_CODE), unavailable verification provider (503 SERVICE_UNAVAILABLE), and bounded rate limits.
- Start a full 30-minute verification window after successful account creation.
- POST /auth/register/recover requires same-origin/CSRF, a bounded payload and three recovery attempts per address/10 minutes plus a 20/day staging cap. A fresh provider password proof resolves the existing identity. Organization, active/initial human state, exact email and fresh password timestamp are checked. Its short provider proof session is terminated before a recovery cookie is issued. No app session, OIDC completion, identity linking, account creation, email verification bypass or automatic email resend occurs.
- Recovery rotates the sealed verification cookie and CSRF value and binds verification/resend to the provider-confirmed ID. No identity ID is accepted from or returned to the browser.
- The form has an existing-account recovery view, distinct failure messages, a visible success heading and a sign-in action. Login offers verification recovery without disclosing account existence. Password fields are cleared after submission and on close. Names, passwords, email codes and provider tokens are not stored in the recovery cookie or logged.

Validation: backend suite 162 passing locally, including expired-flow recovery, wrong credentials, wrong identity/organization, stale factor and failed proof cleanup. Browser CI tests cover invalid codes, outages, session expiry, credential recovery, resend, success and preserved drafts at desktop/mobile sizes. CI/live rollout results are recorded in the completion report.

Rollback: account worker version 3682ba55-1d27-4edd-a361-e9dd76299714; accepted website commit a1385b4293ed81c2fff9810aaf8515ad6cda0334. Preserve credential-bound-v1, secrets, service binding and D1. Do not delete accounts or disable verification to recover access.
