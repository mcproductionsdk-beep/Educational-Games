# Stable library student links — 19 November 2026

## Accepted behavior
The owner explicitly requested one link for each saved set, reused by library Copy share link and editor STUDENT LINK, and confirmed that editing the saved set must update the existing link. This replaces immutable-snapshot behavior for account-saved sets only. Legacy anonymous vocabulary/sentence links and APIs retain their previous behavior.

New saves create one cryptographically random public UUID, distinct from the private set UUID. Saving or renaming updates the public projection atomically without changing that UUID. Moving folders/sets does not change it. Save a copy creates a separate saved set and separate link. Merely typing does not publish; saving does. STUDENT LINK on a saved editor saves changed content with the current revision before returning its existing link. Revision conflicts preserve the draft and do not overwrite public content. Library Copy share link reads the latest saved record.

Public links load the latest saved version on open/refresh. A game already running continues with its loaded version. Link holders can view/play the projection without an account; they cannot edit it or read account IDs, folder structure, private metadata, or private set identifiers. Trash currently preserves an already published projection, matching the preceding independent snapshot behavior. No permanent-delete/revoke or privacy-retention policy is invented here. These remain product decisions.

## Staging implementation
Work branch in both repositories: feature/stable-library-links-20261119.
Accounts runtime commit: 9e1c6c6ab986fd07fb1a69c00ac3a10280ccbc6f.
Website runtime commit: 09d5f5f96dd015f584214951b63306f1fd31c13b.
Accepted website branch feature/accounts-ui was fast-forwarded from 04e19b146f7512839e8d241e837a6861257582e2 to the tested website runtime.
No main/develop or production ref, game engine, production API, DNS, subscription or paid resource changed.

Migration 009_library_stable_shares.sql adds nullable library_sets.share_id, a unique index, library_shares and three SQL triggers. Applying it never backfills/publishes historical private sets. Historical records acquire a stable share on explicit share or next content save; folder moves/Trash alone do not publish them. Public projection contains only family, schemaVersion, title, promptLanguage, language, pairs. Application crypto.randomUUID supplies identifiers; no SQLite randomblob is used. SQL makes a nonnull assigned share ID immutable.

GET /shared-sets/:publicUUID is a bounded, no-store read-only public route. POST /library/sets/:privateUUID/share ensures an existing owner's share under session, CSRF, write-limit and session-revocation checks. The Pages gateway removes credentials on public requests and removes response cookies. New student hash route: #shared-set=<publicUUID>; family validation precedes the existing Word or Sentence game selectors. Invalid/missing links never fall back to the teacher editor. Student routes hide account controls. Existing private UUID editor deep links, legacy #set and #sentence-set links, import direction and engine adapters remain.

New mobile browser coverage exposed selection-action layout moving tiles between clicks; selection now keeps the grid anchored so double-click opens the intended tile.

## Verification and deployment
- Backend: 193 tests, syntax checks, all-nine-migration offline SQLite recovery passed. GitHub Actions run 44560124837.
- Website: 39 Node tests passed; complete Chromium desktop/mobile suite passed, including both editors, stable URLs from library/editor, updated Sentence public content, student-only 8 Word/4 Sentence choices, separate-tab edit, folder hierarchy, drag/Move to, conflicts/errors/draft retention, existing login/registration/profile and actual-engine shell. GitHub Actions run 44560649007.
- Disposable EU Cloudflare D1 56c96b19-fefb-401f-9bdf-0c7b1b1dbafc: migrations 1–8 and synthetic security/library data, then migration 9. Historical publication count stayed zero. Explicit synthetic projections kept IDs through content changes. Time Travel bookmark 00000000-0000000e-00005128-f662fb9c201db50f5482d23e816e4945; deliberate private/public/profile/folder mutations were restored to exact schema and complete row equality across all 17 application tables. quick_check=ok; foreign_key_check empty. Disposable DB deleted.
- Real staging D1 90e2bbf2-9a64-4e4b-8cd5-6e85b68f3fcd: pre-migration bookmark 00000087-00000000-00005128-976cd853a6c7bfdbd8bf8919f1a31d45. Applied additive migration 9 only; verified table/triggers, quick_check=ok, foreign_key_check empty. No real data rewind/export or bulk publication.
- Worker bt-accounts-api-staging version f4f584bc-ef31-4d9c-8f22-b0fa70ba82b6, 100%. Original D1 binding, five inherited secret bindings, credential/private-library modes, compatibility date/flag and redacted observability settings verified preserved.
- Pages bt-vocabulary-platform-staging deployment e04876df-07b3-42e6-bc78-8d3da7c9b914 succeeded for exact website runtime above.
- Live browser verified /version.json exact runtime, missing public link safe error with no editor/account controls, and returning to the normal guest homepage. Live Pages public endpoint returned JSON NOT_FOUND, HTTP404, Cache-Control:no-store and Referrer-Policy:no-referrer. Direct Worker hostname remains Cloudflare Access protected; intended application route uses the existing Pages service binding.
- Positive authenticated save/edit/copy flows were automated with synthetic browser fixtures plus backend SQL tests and Cloudflare D1 recovery. No claim of a new manual signed-in acceptance test on the deployed service. Owner/physical-device acceptance remains outstanding.

## Recovery and operations
Owner confirmed Workers Free; no plan upgrade or new persistent paid resource. The disposable sixth database was removed. Free Time Travel is seven-day history, not an independent long-term backup. Public reads add D1 read usage within the existing free account quotas.

Keep additive schema and share IDs during rollback. Reverting to pre-share backend code would make new public URLs unavailable even though their records remain; prefer a corrected rollout that retains the public read route. Do not drop public projections or rotate identifiers as routine rollback. Do not rewind real staging data without a maintenance hold and reconciliation of session revocations/consumed flows.

Staging entry: https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/
Production promotion and existing privacy/export/retention gates remain separate.
