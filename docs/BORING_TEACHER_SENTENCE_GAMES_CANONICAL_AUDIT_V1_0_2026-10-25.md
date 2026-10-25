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


## 8. Menu customization, content and responsive/mobile implementation addendum (2026-10-25)

This section records **implemented code changes separately from design requirements and observed acceptance**. It supplements Master Menu V1.4 and Sentence Games Menu & Sharing V1.3; it does not silently amend their approval status.

### 8.1 Teacher-menu visual reference and fidelity

The approved **Sentence Games** teacher menu is **not** the main arcade homepage, and the Word Games menu is a separate family. For the Sentence Games teacher menu, the approved design tokens are: max width 1200px; desktop upper-middle anchor `clamp(12px,8vh,80px)`; content-driven height; two columns `1fr 1.2fr` with 9px gap; single column at <=650px; menu background `#17243a`, panel `#20314b`, menu border `#3b5573`, panel border `#496482`; primary green `#167c77` / `#6ee7b7`, secondary blue-grey `#243a55` / `#6486a8`; teacher font `ui-monospace,Consolas,'Courier New',monospace`, regular weight where appropriate; heading 22px, panel heading 15px, labels/help 11px, inputs ~13px, buttons 12px. Source: Master Menu V1.4.

**User-approved target (2026-10-25):** All **four** teacher menus should look virtually identical in geometry, typography, spacing, control sizing, and button placement, while retaining game name, gameplay, instructions and distinct art. This is a **target**, not a claim of completed pixel parity.

**Implemented (GitHub):** menu-scoped V1.4-style CSS additions in Invaders, Eater, Warehouse and Cat; CSS overrides to normalize font weight, input/button fonts, colors, width, responsive layout and textarea wrapping. The earlier isolated preview routes were user-reported 404, so previews are not evidence of accepted visuals. Subsequent direct production/test commits were made. Because overrides were added atop different legacy selectors, they **must be audited for specificity, cascade and effective computed styles** before declaring full fidelity. The user later showed Cat's menu and requested text cleanup, confirming CSS alone did not finish alignment.

### 8.2 Teacher-facing text and information hierarchy

Preserve these controls and their semantics: GAME SETTINGS, language/grammar topic, sentence count, voice and TEST VOICE, PLAY, HOW TO PLAY; YOUR SENTENCES, optional set title, editable bilingual pairs, concise separator guidance, SWAP SIDES, valid count/compact preview, SHARE WITH STUDENTS, PLAY CUSTOM SENTENCES, share result, error and link/copy controls. Preserve natural target-language word order and Unicode accents.

**Cat-specific implemented cleanup:** removed routine development-only display of long raw GitHub V1.7 URL, staging-preview announcement and prototype version banner; simplified duplicate four-pair preview to the first pair; made progress wording teacher-facing. Library-load errors remain visible; staging URL and V1.7 candidate designation remain in code/docs. The share-link container is intended to be hidden until successful sharing; verify actual CSS interaction with the HTML `hidden` attribute before claiming the button is invisible. The user's earlier screenshot showed COPY LINK before sharing, so treat this as a **regression to test**, not a resolved defect.

**Topic-to-editor behavior:** Cat automatically loads all nine selected library pairs into the right editor. Switching to a new topic asks for confirmation before overwriting manually changed text. Verify the initial-load path, manual edits, locale switches, invalid lines, and long translations. Other games may implement topic loading differently; do not claim parity without inspecting their event handlers.

### 8.3 Mobile: menu vs gameplay are different layout contracts

**Teacher menu on mobile:** At <=650px, settings and editor stack vertically in a **scrollable document**. The user must be able to reach all controls, including optional title, textarea, preview, sharing errors and link copy, without horizontal clipping or inaccessible controls. Do not apply gameplay `overflow:hidden` to the teacher menu. Inputs and buttons should be touch-sized, and the keyboard must not trap the user. Avoid forced scaling or fixed viewport-height menu containers.

**Student menu on mobile:** Must show the shared title, locale/count, PLAY, HOW TO PLAY and four-game choices, with readable wrapping, touchable links and vertical scrolling when needed. Do not expose teacher editing. Cross-game links retain the same `#set=` ID and should activate only **after actual set retrieval succeeds**, not merely when the ID matches a regex. Test invalid and unavailable IDs.

**Gameplay on mobile:** A **separate, viewport-contained** contract applies when gameplay is active: game HUD, prompt, playfield, controls and feedback must fit the *visible* mobile viewport without vertical page scrolling or browser chrome hiding essential buttons. Use viewport-aware units and handle portrait orientation, resize, browser address-bar expansion and soft keyboard only where relevant. Do not use menu breakpoints to shrink or alter game mechanics. Desktop arrow/WASD/space and mobile touch controls must remain game-specific.

**Sentence Cat-specific approved mechanics:** 3x3 grid, animated orange pixel-art cat, eight mice/options, swipe up/down/left/right on mobile and arrow keys desktop. Correct selection walks to adjacent mouse, speaks target word, appends word and respawns options; wrong selection approaches, shows sad cat and red NOPE, then returns; the correct next word must be adjacent. Completed sentence is displayed and spoken. Cat gameplay was designed to fit mobile viewport with no vertical scrolling, while its teacher menu must scroll vertically. The current Cat code contains viewport-fit CSS and touch handlers; **this is implementation evidence, not a completed cross-device acceptance test**.

**Other games:** Preserve Invaders' shooting/keyboard/touch controls, Eater's maze controls and Warehouse's pick-up/place controls; test actual on-screen affordances on mobile rather than assuming desktop controls are available. The canonical documents do not prove that every mobile interaction has been tested in the current deployed version.

### 8.4 Required visual and device test matrix

At minimum, inspect each game in:
- Desktop 1440x900 and a smaller laptop around 1366x768, at **100% zoom**; compare outer menu top, width, columns, title, labels, textarea, button hierarchy and visible errors.
- Tablet 768x1024 in portrait and landscape; check two-column behavior above the 650px breakpoint and no clipping.
- Mobile 390x844 and 360x740 portrait; check one-column **scrollable teacher menu**, student-only menu, touch targets, textarea wrapping and onscreen keyboard.
- Mobile landscape / short-height screen; verify game viewport, HUD, playfield, controls and no unintended page scroll.
- For each device: built-in nine pairs, topic switching, custom pairs, accents, swap, voice, share/create/copy/retrieve, four-way navigation, gameplay, pause/restart/menu, wrong/correct feedback, and accessible error messages.

Record **observed** pass/fail with browser/device/viewport, date, exact URL, SHA and screenshot. Never mark a test passed merely because CSS/JS code exists or a GitHub commit succeeded.

### 8.5 Outstanding asymmetries to resolve

1. Cat teacher-menu DOM/CSS structure differs from Eater, Warehouse and Invaders; CSS overrides alone do not ensure identical geometry or placement.
2. The Cat student menu uses its own `#studentGames` navigation; three other games use the injected `#crossGameNav`. Functionally similar, but not a canonical reusable component.
3. The main Sentence Games launcher has a four-tile layout; the three other game menus and Cat student menu use different card/grid styles. Review against student-navigation standard before claiming identical student UI.
4. Cat's V1.7 success/status wording has been simplified; compare all four for consistency without hiding actionable errors.
5. The second Sentence Eater repo lacks the latest four-game menu updates and needs route-confirmed reconciliation.
6. The V1.7 candidate dependency and staging API are still pre-release boundaries; do not label the entire four-game family production-approved on the strength of menu changes.
7. The existing documentation has no completed evidence-backed four-game mobile QA matrix; schedule and record real-device verification before release.

**Future development rule:** For any menu/mobile change, first compare the current HTML/CSS and approved reference, define exact visual/functional parity, patch only the relevant menu or viewport behavior, test all breakpoints and student sharing, and then update this addendum with observed results and SHAs. Do not replace gameplay CSS with teacher-menu rules.
