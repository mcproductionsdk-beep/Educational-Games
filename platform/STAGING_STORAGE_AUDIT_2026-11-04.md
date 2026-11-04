# Staging storage and deployment audit — 2026-11-04

Status: STAGING DEPLOYED; LIVE AUTOMATED JOURNEY PASSED; PHYSICAL-DEVICE ACCEPTANCE PENDING.

## Current verified result — 2026-11-04

Tested central launcher: https://eb74f219.bt-vocabulary-platform-staging.pages.dev/ at bfd756c895f0053753546eb6682726a9a4af8a73.
Pinned engine: https://7bd7d241.bt-vocabulary-snake-preview.pages.dev/snake-game.html at af58cb3080a2e70737db59777e646cbef88d4eaa; artifact 5433403055ef05621455c7d608971078a36308fb.

Live browser verification passed: real staging API publication, fresh guest links, Danish-to-Spanish direction, desktop 1280×900 and emulated phone 390×844 play/pause/restart/same-set return, and immutable original snapshot after republication. Browser requests were limited to the central staging origin, pinned engine origin and staging API. Actual shell and engine CSP headers were checked, as were 404 responses for excluded test/doc paths.

Synthetic records V6PPXU and C4PBFW were found in staging by read-only SQL and absent from production using their exact IDs/titles. Both verification queries reported rows_written=0 and changed_db=false. Workflow: https://github.com/mcproductionsdk-beep/Educational-Games/actions/runs/41837030837 . Machine-readable evidence is platform/staging/ACCEPTANCE_2026-11-04.json.

The dedicated central Pages project has only NODE_VERSION=22, no database/service bindings, no credentials and no custom domains. It deploys only the migration feature branch to a clean dist-staging output. Production main branches and public routing remain unchanged. Physical touch, audible pronunciation/effects and performance acceptance remain pending.

The access failure below is historical; reauthentication later restored Pages write access. The earlier 14/462 row counts predate the two authorized synthetic staging publications.

## Verified account resources

Cloudflare account: 5189a2f7ec21bde11d2e7b71de93345f.

| Environment | Worker | D1 name | D1 UUID | Creation limiter namespace |
|---|---|---|---|---|
| Staging | boringteacher-vocabulary-api-staging | bt-vocabulary-multilingual-staging | 419a5c80-c521-458f-af48-ff9aed3a8c05 | 731205 |
| Production | boringteacher-vocabulary-api | boringteacher-vocabulary | 2ff8a48c-e327-4d19-bf1d-ce184e931b09 | 731206 |

Worker settings were retrieved directly. Staging has only its own DB binding and its own rate limiter; production has a distinct DB/limiter. The downloaded staging Worker source uses env.DB for INSERT and SELECT and contains no fetch/service fallback to production. Staging GET/POST route/schema logic was inspected. Both services are public sharing APIs; wildcard CORS is not authorization or proof of production request denial.

Read-only SQL verified the staging vocabulary_sets schema: id primary key, title, language, vocabulary JSON and created_at. At inspection, staging had 14 rows and production 462; neither query changed data (rows_written=0, changed_db=false). Counts are dated observations, not an invariant or test of the public API.

The existing API accepts 5–200 pairs, each trimmed nonempty string up to 200 characters; title is trimmed/truncated to 100; six canonical locales must differ. This newly inspected contract must be reconciled with the client before staging publication; no service/schema changes are authorized incidentally.

## Preview provenance

Existing engine feature deployment: https://2b35996f.bt-vocabulary-snake-preview.pages.dev
Source: Vocabulary-Snake feature/runtime-config-20261103 at fdc43162080154fd1aa948a96eef7be566c2a56a.

Existing central feature deployment: https://d08ec24f.bt-homepage-preview.pages.dev
Source: Educational-Games feature/central-runtime-config-20261104 at 1db7d876b84601e7599ac5060c326e01084ddedd.

These existing deployments publish repository-root files and do not establish an operational integrated staging entry. They must not be presented as the new accepted preview. The existing homepage root still contains legacy production configuration; it is not the safe staging launcher.

## Prepared engine output

Vocabulary-Snake/scripts/build-preview.mjs builds only index.html, snake-game.html, version.json, engine/snake.js, engine/session.mjs, engine/snake.css, engine/staging-bootstrap.mjs, engine/build.mjs and _headers into dist-preview. Tests/docs/fixtures and the legacy bridge are absent. The generated artifact build ID covers the core code, entry and bootstrap template. The bootstrap accepts only the dedicated proposed bt-vocabulary-platform-staging Pages host/subdomains, with exact runtime origin/window validation. The header policy denies engine network connections and limits frame ancestors to that staging project. No production services or credentials are bundled.

Required engine Pages build settings:
- Project: bt-vocabulary-snake-preview
- Build command: node scripts/build-preview.mjs
- Output directory: dist-preview
- Root directory: empty/repository root
- Preserve repository and develop/feature branch mappings; no custom domain or production route change.

Local build succeeded with artifact ID 5433403055ef05621455c7d608971078a36308fb. This is an artifact ID, not a source commit or deployment proof.

## Historical blocking evidence (resolved)

Cloudflare rejected PATCH of the engine project's build settings after its reauthentication prompt: UNAUTHORIZED, missing permission/scope for the write action. No Pages configuration update succeeded. Direct HTTP checks of the staging Worker/Pages origin from this execution environment returned HTTP 403; this is not proof that the deployed public service itself fails for an ordinary browser.

No synthetic public-API POST, new shared set, D1 insert, Worker update, new Pages project or final deployment was performed. Do not use an admin SQL insert to substitute for testing the real staging API journey.

## Original action list (deployment and synthetic checks now completed; device acceptance remains)

1. Restore Cloudflare Pages project-write access or explicitly approve a signed-in browser fallback for those dashboard operations.
2. Apply clean output settings and verify the resulting engine deployment, commit, version metadata, response headers and output exclusions.
3. Prepare/build the dedicated central staging application with an explicit immutable engine URL/build ID and the verified staging vocabulary endpoint; keep the production homepage untouched.
4. Deploy that isolated central staging project (proposed name bt-vocabulary-platform-staging), with no production domain, production bindings or credentials.
5. From an actual browser, publish nonpersonal content through the staging API, reopen its fresh link and verify play/return. Confirm the specific synthetic record is present in staging and absent from production by read-only SQL. Record all URLs/SHAs and client attempted requests.
6. Perform physical-device touch and audible-speech acceptance separately. No release/production promotion until all applicable gates pass.
