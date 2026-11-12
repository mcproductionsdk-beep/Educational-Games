# Production candidate packages — prepared, not deployed

This prepares audit R01/R02's production build surface. It does not authorize a
public release, mark the full migration audit complete, or provision hosting.

## Exact proposed topology

| Component | Configuration | Status |
|---|---|---|
| Shared site | `https://boringteacher.com/` | Existing canonical public origin; replacement not deployed |
| Engine host | `https://games.boringteacher.com/` | Proposed only; DNS/hosting not provisioned or verified |
| Word API | `https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev` | Existing production service; no live test writes |
| Sentence API | `https://boringteacher-sentences-api.mcproductionsdk.workers.dev` | Existing production service; no live test writes |

The engine host is separate from the teacher origin. Engines accept only the exact
teacher origin, their validated protocol and session; no wildcard parent or staging
origin is allowed. Engine CSP denies network connections and frames outside the
teacher origin. The shared site can frame the specified engine origin and connect
only to itself and the two production APIs. `www` is not silently added: verify its
canonical redirect before release, or explicitly review a separate alias policy.

## Rebuild and inspect

```sh
node scripts/production/build.mjs
node scripts/production/verify.mjs
node scripts/production/test-integrity.mjs
npm install --no-save playwright@1.56.1
npx playwright install chromium
node scripts/production/test-browser.mjs
```

The builder downloads only allowlisted files at the immutable commits in
`release/production/sources.json`, verifies every SHA-256, and removes its working
source tree from the final output. It does not read a mutable default branch or
depend on live preview builds. A verified local source cache can be supplied with
`--source-cache=/absolute/path`, containing `central/` and each game-ID directory.
No credentials, deploy command or automatic promotion step is present.

The workflow **Production candidate packages** uploads the reviewed package tree
and candidate manifest as a GitHub Actions artifact, retained for 30 days. The
source pins and build recipe remain in Git for later reproduction. Download the
artifact from the run attached to the exact PR head, not an arbitrary latest run.

| Output | Publication boundary |
|---|---|
| `dist-production/site/` | Shared site only: production UI, runtime, settings, both pinned catalogues, response headers and non-SPA 404 |
| `dist-production/engine-host/<game-id>/<artifact-sha256>/` | One independently versioned engine's approved files and build metadata |
| `dist-production/engine-host/_headers` | Engine response policy and immutable caching for versioned directories |
| `dist-production/engine-host/404.html` | Non-playable homepage fallback for unwanted/missing entries |
| `dist-production/candidate-manifest.json` | Review/integrity evidence; outside both public roots |

Never publish the repository root or `dist-production/` as one website. Upload the
two publication roots separately. Do not publish source caches, baseline HTML,
fixture launchers, scripts, tests or the review manifest as game assets. No hosting
configuration has been changed to use these outputs.

## Package transformations and identity

All eight Word and four Sentence engines retain their reviewed source identities.
Racer and Word Warehouse retain distinct desktop/mobile entries selected by the
shared runtime. Existing preview build recipes are run only in isolated temporary
directories where needed to reproduce accepted artwork/layout transformations;
their extra outputs are excluded from publication.

Production transformations remove sample launchers, built-in sample sets and
obsolete setup/editor/catalogue paths. Word Eater and Word Invaders retain typed
initialization and gameplay while their old menu bindings/local catalogues are
removed. Frog/Match test starts are removed. Sentence standalone sample handlers
and sample panels are removed. Engine code and inline scripts are loaded from
external allowlisted files only after the exact parent-origin gate succeeds.
Standalone/foreign-parent visits receive a non-playable homepage link and do not
load gameplay code. Valid family-specific set fragments are preserved on that
link; legacy public route compatibility is still a separate release gate.

Production build IDs are intentionally different from preview IDs. The complete
pre-seal asset map plus response CSP defines a SHA-256 content-addressed directory;
the Word protocol retains its required 40-hex content ID and Sentence uses 64 hex.
Build-ID/version modules are excluded from this pre-seal calculation to avoid a
circular hash, then every final file is individually SHA-256 recorded. The central
registry locks exact production entry URLs and matching IDs. Integrity verification
rejects modified or unexpected files.

Staging sources, staging configuration, existing preview projects, engine source
repos, public game routes, DNS, Workers and D1 are unchanged. Production-specific
UI is generated from the pinned shared implementation; it is not a separately
maintained copy of each game's menu. Future source updates require new reviewed
source pins and a new package manifest.

## Verification boundaries

Checks cover file inventories, script syntax, no staging/source-host references,
CSP, integrity failures, rejected production settings, browser startup/lifecycle
for all 12 games in desktop/portrait, direct/untrusted-parent fallback and mocked
production API round-trips. All production API requests in browser tests are
intercepted; no real production sets are created. Tests serve the actual generated
bytes under virtual HTTPS production origins. They do not prove DNS, deployed
Cloudflare header behavior, audible voices, physical devices or complete rounds.

## Gates before public deployment

1. Approve or revise the proposed engine host; provision and verify it separately.
   Keep deployment permissions/build triggers disabled until the exact candidate
   is approved. Do not repoint existing preview projects or their production branches.
2. Merge the staged feature work through the required integration/release PR path,
   freeze exact source commits and rerun the production package checks there.
   A prepared feature artifact is not evidence of release-branch protection.
3. Close remaining audit findings: resilient catalogue loading, capability checks,
   same-origin Word draft compatibility, Sentence grammar editorial approval,
   physical-device/audible voice testing and legacy-link routing. This packaging
   change does not claim these findings are closed.
4. Verify current production API/CORS behavior and staging/production separation
   without copying staging databases or changing published snapshots. Explicitly
   authorize any public test-set creation as part of release verification.
5. Preserve all existing public game routes and Word/Sentence fragments until their
   compatibility redirects/launchers are implemented and tested. Replacing only
   the root site must not strand `/set/` or legacy game clients.
6. Capture current site/engine/configuration/route recovery evidence and rehearse
   restoring it in isolated hosting. Retain previous content-addressed engine
   directories when publishing later candidates: never overwrite or discard a
   version still referenced by the current or rollback site. The initial package
   is not an implemented append-only retention service.
7. Present exact tested artifacts, open limitations and rollback steps for explicit
   owner authorization. Deploy approved engine assets before switching the shared
   registry/site. No production cutover is authorized by preparing these packages.
