# Staging website account integration — 2026-11-18

Scope: Sign in, verified account display and local Log out only. No private-library CRUD, tiers, billing, game engine or production change. Base: catalogue candidate 1edb51b3011855a261266cc26da3909da3c65303. Branch feature/accounts-ui. Exact website https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev . Existing staging/production branches and routes preserved.

Architecture: Pages advanced-mode _worker.js routes only /auth/* and /me through ACCOUNTS_SERVICE binding to bt-accounts-api-staging. Actual original URL/Origin/HttpOnly cookies preserved; no arbitrary forwarding header, CORS, bearer-token storage or wildcard callback. Accounts Worker permits only its original host and this exact staging website. OIDC discovery/PKCE/state/nonce/auth_time validation, credential guard and D1 checks preserved. Website callback must be added to existing ZITADEL OIDC application before live login:
https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/auth/callback
Retain original workers.dev callback. No provider admin credential is held by this integration.

Account UI reads same-origin /me without caching. 401 shows Guest; valid account_id shows Signed in / account prefix; redirects/503/network failure show unavailable rather than claim authentication. Same-origin POST logout only; successful 204/401 shows Guest, failure cannot claim logout. Focus/pageshow/visibility refresh session status. No tier/name/email invented from account ID. Save-to-folder remains explicitly browser-local prototype. Guest content does not depend on /me success.

Drafts: initiating sign-in stores only current Word/Sentence editor fields, family and valid share fragment in per-tab sessionStorage, restores on return; never authentication credentials. Storage failure cancels navigation with feedback. Logout/account checks do not rerender editor.

Validation: 27 platform Node tests pass; accounts suite 126 tests passes, including website origin and callback/CSRF checks. Chromium UI test covers guest/signed-in/unavailable/failed logout/confirmed logout and preserved draft; local Chromium launch blocked by execution environment, so GitHub CI browser result required before deployment. Existing platform/game regression tests retained.

Live owner acceptance pending: provider callback registration, click Sign in, correct fixture account prefix, editor retained after callback, refresh persistence, Log out -> Guest and /me Unauthorized; verify guest game and student-link route still work. Full provider login cannot be claimed from synthetic tests. Existing workers.dev cookie does not automatically sign in the website (separate host-only cookies).

Deployment: preview binding only, scoped branch auto-deploy allowlist, fail_open=false on preview auth gateway. Original project production branch unchanged. Rollback website to base branch/previous preview and remove service binding if unused; roll back Accounts Worker to 27aad3b6-5fc1-44d6-997b-4723c1b8d98a. Additive origin support alone does not register provider callback. Runtime bindings inherited, no database mutation or key rotation. Staging-only provider-consistency assumption and production blockers remain.
