# Private library development checkpoint — 19 November 2026

Status: safety preparation only; no library UI or API deployed.

The owner authorized isolated folders and Word/Sentence saved-set work while preserving the accepted website aesthetics and current game/editor/public-sharing behavior. The full safety record is in [Accounts preflight](https://github.com/mcproductionsdk-beep/BoringEducation-Accounts/blob/0c7a7507a944f15a31c4a2a9169a031d2225071a/docs/LIBRARY_STAGING_SAFETY_PREFLIGHT_2026-11-19.md).

Website baseline: cbf7cdd6a495a15c24730f3b4d456f60dcbf94c0. Backend baseline: be671a177e2a6958a4d43c159924e01ff706fbe0. Each repository has checkpoint/pre-library-20261119 and checkpoint/develop-before-library-20261119. develop was advanced by an expected-head, non-force fast-forward. main and accepted feature/accounts-ui were not moved.

Library work uses feature/private-library-20261119. Browser tests use fixtures; local storage tests use temporary SQLite. The actual staging Pages service binding uses shared bt-accounts-api-staging and must not be used for experimental development deployments. The legacy bt-homepage-preview project builds static previews of all branches; it has no inspected data/service bindings. No shared-staging backend or production deployment was made for this preparation.

Central runtime CI now includes the library branch. GitHub protection remains unenforced; no paid plan or visibility changes were made. The Accounts synthetic backup/restore rehearsal passes, but Cloudflare-specific restore testing and a fresh data recovery checkpoint remain mandatory before shared-staging library mutations. A Time Travel bookmark alone is not a verified backup/restore procedure.

Initial library scope: private folders; save/open/edit/move/delete Word and Sentence sets; delete folder moves sets to Unfiled; Free five saved sets combined. Preserve drafts on errors or navigation. Server-side ownership, session/CSRF checks, atomic quota enforcement, revisions and retry safety are required. The plan catalogue remains specification-only. No paywall, paid subscription, AI calls or production release is included.
