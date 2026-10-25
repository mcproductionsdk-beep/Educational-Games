# BORING TEACHER — SENTENCE GAMES CANONICAL AUDIT & OPERATING BASELINE V1.0

**Date:** 2026-10-25  
**Status:** Evidence-based code/documentation reconciliation. This is the **current Sentence Games overlay** to the 2026-10-23 standards, not a declaration that all games passed live acceptance.  
**Authority:** User-approved four-game navigation and teacher-menu consistency; existing Master Menu V1.4, Sentence Games Menu & Sharing V1.3, Grammar Library Spec V0.4, Voice Routing V1.1, Development Standards V4.2 and Canonical Source Registry V1.2 remain normative except where the verified 2026-10-25 facts below supersede their *dated inventory/status*. Historical versions are preserved.

## 1. Read this before changing a Sentence Game

1. Read this current audit **and** the underlying family standards; do not infer a deployed contract from screenshots or an old conversation.
2. Resolve **public route → Cloudflare mapping → origin repository/branch → entry file → imports**. The route-to-origin mappings below are code-location evidence, **not independently verified live Cloudflare configuration**.
3. Fetch the current exact source blob and compare with intended changes; check duplicate copies and existing dependencies.
4. Decide whether the task is teacher UI, student UI, library content, API, gameplay, or deployment. Keep the edit limited to that surface.
5. Keep a testable rollback SHA; after commit verify live HTTP, browser, mobile, voice, custom sentences, student sharing and actual cross-game play. Mark each acceptance stage separately.

## 2. Current four-game inventory (GitHub source inspected 2026-10-25)

| Game | Public-facing route | Inspected source on main | Student four-game nav | Menu CSS V1.4 override |
|---|---|---|---|---|
| Sentence Invaders | `/sentences-invaders/` | `mcproductionsdk-beep/Sentences-Invaders/index.html` | Added | Added |
| Sentence Eater | `/sentence-eater/` | `mcproductionsdk-beep/Educational-Games/sentence-eater/index.html` | Added | Added |
| Sentence Warehouse | `/sentence-warehouse/` | `mcproductionsdk-beep/Educational-Games/sentence-warehouse/index.html` | Added | Added |
| Sentence Cat **TEST** | `/sentence-cat-test/` | `mcproductionsdk-beep/Educational-Games/sentence-cat-test/index.html` | Added | Added |

The shared launcher is `mcproductionsdk-beep/Educational-Games/sentence-games/index.html`; it now offers **four** choices, with Cat explicitly marked Test. It uses `#set=ID` links. The Invaders source is in a separate repository: never assume `Educational-Games/sentences-invaders/index.html` exists. The Sentence Cat permanent production route has **not** been approved or created by this audit.

**Critical duplicate:** `mcproductionsdk-beep/Sentence-Eater/main/index.html` was inspected and is **not identical** to `Educational-Games/main/sentence-eater/index.html`. The separate repository currently lacks the newly added four-game student navigation and V1.4 menu CSS override. Prior documents instruct synchronizing both. **Do not claim synchronization; verify which origin is live before reconciling, then compare whole files and preserve game-specific differences.** No synchronization was performed in this documentation audit.

## 3. Library and sentence-data contracts

All four inspected current game entry files refer to the **V1.7 candidate** JSON at:
`https://raw.githubusercontent.com/mcproductionsdk-beep/Educational-Games/content/sentence-library-v1-7-editorial/libraries/sentences/v1.7-candidate.json`.

The candidate contains **5 locales, 123 locale-topic entries and 1,107 English/target pairs** (9 per topic, 3 Foundation + 3 Development + 3 Application), per Grammar Library Spec V0.4. JSON orientation is `[English, target]`, and exact topic keys and locale codes are contractual. The separate **published V1** file `main/libraries/sentences/v1.json` still exists and contains topics with fewer than nine pairs; it is **not equivalent** to V1.7. Do not substitute V1 merely because its URL looks more production-ready. The V1.7 URL points to a mutable development branch and is a **release risk**. Pin an audited immutable revision or promote an approved versioned production file **only after content approval and regression tests**; do not silently promote the candidate.

The Sentence Games sharing API is distinct from Word Games vocabulary sharing:
`https://boringteacher-sentences-api-staging.mcproductionsdk.workers.dev`.
Use `POST /sentence-sets`, `GET /sentence-sets/{id}`. Teacher editor uses `English | target` or TAB, while API `pairs` are `[target, English]`. **The property is `pairs`, not `sentences`.** The latter caused the Sentence Cat API validation error and was corrected. Validate 2–100 pairs, title/locale, accents and round-trip orientation against the actual backend contract; do not confuse it with Word Games `/sets`.

## 4. Shared teacher and student UX contracts

**Teacher menu:** left GAME SETTINGS (locale, grammar topic, sentence count, voice/test, built-in Play, How to Play); right YOUR SENTENCES (optional title, bilingual editor, format guidance, Swap Sides, valid count/compact preview, Share with Students, Play Custom Sentences, status/link). Selecting a topic in Sentence Cat now **automatically fills the editor with all nine candidate pairs**, with confirmation before replacing manually edited content. This automatic behavior is **verified for Cat**, not yet asserted for every other game. The editor must wrap long lines without horizontal scrolling; retain all text in the underlying value.

**Presentation:** same teacher-menu typography, dimensions, responsive columns, control hierarchy and layout across all four; per-game name/instructions remain distinct. V1.4 menu-only CSS overrides were committed in each current main entry file. These overrides are **not proof of exact visual parity**: compare screenshots at identical viewport/zoom and audit specificity, effective cascade, labels, layout, mobile scroll and accessibility. Do not modify gameplay HUD/canvas fonts. Sentence Cat's teacher-facing development chatter was removed (raw library URL, staging notice, prototype banner); keep actionable errors and technical diagnostics in code/docs.

**Student mode:** `#set=<id>` loads the exact shared sentence set, hides teacher editing, offers Play and How to Play, and provides **all four game choices**. Cross-game links must preserve the identical set ID, use the correct destination, and must not be enabled before a successful load. **Current asymmetry:** Cat explicitly enables links after successful set loading; the other three received a menu script that can display links based on a syntactically valid hash alone. This needs a verified loading-state gate before calling the behavior fully compliant. The central launcher validates the set before enabling cards. A self-link tile may be shown for parity, but avoid unexpected reload loops.

**Voice:** apply Voice Routing V1.1. Locale drives `SpeechSynthesisUtterance.lang`; exact then base-language voice preferred; still request speech if no enumerated matching voice; Test Voice uses the same function as gameplay. Successful invocation is not evidence of correct audible pronunciation.

## 5. Evidence and open release gates

**User-confirmed:** Sentence Cat hosted teacher menu loaded; V1.7 topic populated nine pairs; Sentence Cat teacher Share with Students succeeded after changing payload from `sentences` to `pairs`. The user also showed a functioning three-game central launcher with a loaded shared set. These confirmations **do not** prove all four destinations play the same set or that all four student menus are accepted.

**GitHub committed but not comprehensively user/browser accepted:** four-game launcher tile, cross-game student navigation in all four, CSS alignment changes, Cat teacher text cleanup. Preview routes produced user-reported 404s; a committed preview file is not proof of live deployment. No complete mobile/desktop matrix, TTS verification or end-to-end cross-game test has been recorded.

**Required before release:**
1. Resolve Cloudflare routing and origin for every public URL, especially the two Eater copies; synchronize approved copies safely.
2. Verify actual shared-set load before showing links in Invaders/Eater/Warehouse; test invalid/expired/missing IDs and API outages.
3. Test four destinations from each game using one known shared set, check title, locale, exact nine pairs, order and gameplay.
4. Compare four teacher and four student menus at matching desktop/mobile viewport and zoom; ensure mobile teacher scrolling, game viewport fit, textarea wrapping, clear accessible errors, button states and no development-only text.
5. Confirm built-in/custom gameplay, wrong-answer behavior, pause/restart/back, pronunciation and student-only controls in each game.
6. Resolve candidate-library version pinning and staging-versus-production API promotion before declaring a stable release.
7. Promote Cat to an approved permanent route only after these checks; update launcher labels and canonical registry in the same release.
8. Record source SHA, origin, live response, assets, browser screenshots, tested URL/ID, tester/date, rollback and acceptance separately.

## 6. Documentation asymmetries and resolution policy

- Sentence Games Standard V1.3's **three-game** inventory and Master Menu V1.4's **three-game** publication note are historical as of 2026-10-25; this document is the current four-game inventory.
- Master Menu V1.4's **13-card arcade taxonomy** predates Cat. Cat remains a **test**, so do **not** silently change the main homepage count or production taxonomy.
- Grammar Spec V0.4 correctly marks V1.7 **candidate**; retain that warning even though all four currently consume it.
- Canonical Registry V1.2 focuses on Word Games and has provisional Sentence routes; use this addendum for current Sentence code locations while independently verifying Cloudflare mappings.
- Development Standards V4.2's distinction between GitHub commit, public HTTP and browser acceptance remains mandatory.
- Student Sharing Contract V1.1 is predominantly about **Word Games**; do not apply its vocabulary payload/route conventions to Sentence Games. Sentence Games Menu & Sharing V1.3 governs the sentence API.
- Historical source-of-truth records and screenshots are evidence of their dates, not current live-source authority.

## 7. Future-maintenance checklist

For each change, log: date; request; relevant canonical docs; source repo/branch/file/blob SHA; active route evidence; affected shared/duplicate copies; library/API versions; exact diff scope; commit SHA; tests and screenshots; acceptance classification; rollback SHA; next action. Update this overlay when a verified source/route/contract changes; preserve history with a new dated revision instead of retroactively claiming older releases were accepted.
