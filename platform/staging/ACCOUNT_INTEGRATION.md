# Staging website account integration — 2026-11-18

Scope: Sign in, verified account display and local Log out only. No private-library CRUD, tiers, billing, game engine or production change. Base: catalogue candidate 1edb51b3011855a261266cc26da3909da3c65303. Branch feature/accounts-ui. Exact website https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev . Existing staging/production branches and routes preserved.

Architecture: Pages advanced-mode _worker.js routes only /auth/* and /me through ACCOUNTS_SERVICE binding to bt-accounts-api-staging. Actual original URL/Origin/HttpOnly cookies preserved; no arbitrary forwarding header, CORS, bearer-token storage or wildcard callback. Accounts Worker permits only its original host and this exact staging website. OIDC discovery/PKCE/state/nonce/auth_time validation, credential guard and D1 checks preserved. Website callback must be added to existing ZITADEL OIDC application before live login:
https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/auth/callback
Retain original workers.dev callback. No provider admin credential is held by this integration.

Account UI reads same-origin /me without caching. 401 shows Guest; valid account_id shows Signed in / account prefix; redirects/503/network failure show unavailable rather than claim authentication. Same-origin POST logout only; successful 204/401 shows Guest, failure cannot claim logout. Focus/pageshow/visibility refresh session status. No tier/name/email invented from account ID. Save-to-folder remains explicitly browser-local prototype. Guest content does not depend on /me success.

Drafts: initiating sign-in stores only current Word/Sentence editor fields, family and valid share fragment in per-tab sessionStorage, restores on return; never authentication credentials. Storage failure cancels navigation with feedback. Logout/account checks do not rerender editor.

Validation: 27 platform Node tests pass; accounts suite 126 tests passes, including website origin and callback/CSRF checks. Chromium UI test covers guest/signed-in/unavailable/failed logout/confirmed logout and preserved draft; local Chromium launch blocked by execution environment, so GitHub CI browser result required before deployment. Existing platform/game regression tests retained.

Live owner acceptance pending: provider callback registration, click Sign in, correct fixture account prefix, editor retained after callback, refresh persistence, Log out -> Guest and /me Unauthorized; verify guest game and student-link route still work. Full provider login cannot be claimed from synthetic tests. Existing workers.dev cookie does not automatically sign in the website (separate host-only cookies).

Deployment: preview binding only, scoped branch auto-deploy allowlist, fail_open=false on both environments of this staging-only Pages project (Cloudflare requires matching values); service binding remains preview-only. Original project production branch unchanged. Rollback website to base branch/previous preview and remove service binding if unused; roll back Accounts Worker to 27aad3b6-5fc1-44d6-997b-4723c1b8d98a. Additive origin support alone does not register provider callback. Runtime bindings inherited, no database mutation or key rotation. Staging-only provider-consistency assumption and production blockers remain.


## Deployment and browser verification

Website commit 774d6981e999c5d4f9100587eb49a61b62184c54 passed CI 44346933979: 27 platform tests, Chromium account-control state tests, and existing real-engine shell checks at desktop/mobile sizes. Accounts commit 48177a47fc125f0f7143cbd81d4f7637ae45a3b7 passed CI 44347019776 (126 tests).

Accounts deployed version ae2fd106-116f-4b49-9e70-f97ce493a1b7 at 100%, preserving existing secret/D1 bindings and console-only redacted observability. Pages deployment 58b13303-3152-427c-94e6-da15dd5a1e17 uses feature/accounts-ui. Preview service binding ACCOUNTS_SERVICE verified pointing to bt-accounts-api-staging, environment production (Cloudflare's name for that staging Worker's active environment; not a production product). Existing staging project production branch remains feature/central-runtime-config-20261104. An initial JSON deployment request ignored branch and queued the unchanged existing production-branch SHA 46740e238b9cd9698f7d2eb36a076d971c0694a0; subsequent multipart request deployed the intended isolated branch. No production product was changed.

Live browser verified website root renders Guest / Sign in, complete Word editor/catalogue and guest game choices. Clicking Sign in traversed the same-origin service binding and reached ZITADEL with the exact new callback. Provider returned invalid_request: requested redirect_uri missing in client configuration. This is a specific configuration blocker, not an authentication/runtime test pass. No password requested or entered. Website signed-in display, real logout and draft return need final live acceptance after owner registers callback in existing OIDC application, retaining the previous callback.

Next owner action: ZITADEL staging console > Projects > existing accounts staging OIDC application (client ID 399554402458865942) > Redirect Settings > add https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/auth/callback . No wildcard, secret or new provider application needed.
