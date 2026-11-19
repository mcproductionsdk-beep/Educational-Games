# Email registration staging checkpoint — 2026-11-19

Owner authorized email/password registration, email verification and matching account windows. Staging only, no paid service or production changes. First/last name are included because ZITADEL SetHumanProfile requires both. Existing main website aesthetics, engines, sharing and working sign-in are preserved.

## Source and deployments

- Accounts code: 7749d9f5e850b0bd6bda80592b1dcf6ca415315c on BoringEducation-Accounts feature/custom-login-20261119. CI job 135453321678 passed; 156 account tests including registration and unverified OIDC callback rejection.
- Worker bt-accounts-api-staging version 3682ba55-1d27-4edd-a361-e9dd76299714 uploaded preserving all existing bindings and credential-bound-v1; no D1 schema change.
- Website code: a1385b4293ed81c2fff9810aaf8515ad6cda0334, feature/accounts-ui. CI job 135453415708 passed contract, account-control, combined-login, registration desktop/mobile and shell checks. Pages deployment 19596831-6c0f-4b81-b441-84180cdc4c14 succeeded.
- Review URL https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/ . Yellow Create account button and matching modal were observed live. Provider settings were read successfully by /auth/register/context; it correctly reported registration is not open yet.

## Activation is PENDING

In the staging ZITADEL BoringTeacher Organization Settings / Login Behavior and Security, User Registration allowed was initially unchecked. It is now selected in the browser draft, but Save has NOT been clicked. All other controls were preserved. A final browser security confirmation is needed because saving enables new account creation. User takeover is the remaining activation step. Do not say self-registration is enabled until a fresh provider read confirms it.

No real account was created by the agent. No verification email was sent or code/password inspected. End-to-end account creation, inbox delivery, wrong-code rejection, email verification, sign-in/refresh/logout after verification remain to be observed with a privately created staging test account. User must enter the new password and code privately; never ask for them in chat or fill/read them through model-visible browser APIs.

## Implemented path

/auth/register/context, /create, /verify, /resend are same-origin routes with exact Origin/Fetch-Site checks, bounded JSON, CSRF and a separate sealed HttpOnly Secure SameSite=Strict registration cookie. The pending provider ID is generated server-side and never accepted from browser JSON. Provider scopes/organization and email URL template are fixed; no admin or return-code path is exposed.

POST /v2/users/new creates a human in organization 399547194497110294 with an unverified email, initial password (no forced change) and an email verification sendCode. It never marks email verified or returns a verification code. A custom random decimal provider ID supports retry recovery only for that sealed flow and exact email, never an email-based merge into an existing user. The standard OIDC callback and immutable internal account mapping remain the only route to a local authenticated session.

Verification link uses https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/#verify-email={{.Code}} . The code stays in the fragment, is removed from history and is never sent on GET or automatically consumed. The user explicitly submits Verify email. The cookie binds the code submission to the registration's provider ID. A link opened in a different browser without the registration cookie cannot verify through this UI; return to the original browser. Resend is bounded and keeps the same pending identity. The provider must confirm an active user with verified email before the UI reports success.

The OIDC adapter now calls beforeSignIn after token verification and flow consumption, before local session creation. Staging uses the server-side registration client to assert active + email verified in the fixed organization. This also rejects unverified users coming through the hosted legacy login. Existing password-generation/credential-bound reset protection remains enabled.

Staging request caps via keyed hashes and atomic consumed_oidc_flows unique inserts: create 3 per address/10 minutes, 10 globally/day; resend 2 per address/10 minutes, 20 globally/day plus one per flow/minute; verify 6 per address/10 minutes, 100 globally/day; context 12 per address/10 minutes, 100 globally/day. No raw IPs, credentials, codes, user IDs, profile fields or provider payloads are logged. Fixed phase/operation/status diagnostics only. No new paid SMTP, provider, plan or infrastructure.

## Recovery

Prior accepted website 74d1b579ab377509b78992892c7a3b269929c68a and Worker 02d54e8b-1fd6-463a-ab13-150cafef979b. Restore those code versions if needed, preserve encrypted secrets and D1, and disable registration if it was activated. Do not delete created accounts without explicit scoped authorization. Registration disablement must not remove existing user accounts.
