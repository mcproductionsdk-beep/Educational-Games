# BORING TEACHER — SOURCE OF TRUTH V17: WORD SNAKE MULTILINGUAL RELEASE
Date: 2026-10-23
Status: Addendum to V16; preserves all V16 cautions for other games.

## Confirmed breakthrough
- User explicitly confirms multilingual Word Snake and student sharing now work, following the “Unsupported language” cache fix. User also confirms **no teachers have created shared exercises**, so legacy shared-set backward compatibility is not a release requirement.
- Canonical Word Snake route: `https://boringteacher.com/word-snake/`. Cloudflare game router directs it to dedicated `mcproductionsdk-beep/Word-Snake` GitHub Pages. Updating `Educational-Games/word-snake/` alone **did not** update the public game. Dedicated `Word-Snake/main` was advanced to development release SHA `e1537f2a271a85fb49f6a563f4a811ea98f78275`; later cache-fix commits: `1d49ada1b936e09394f0799237340709683a6f53` (index), `46c601503fe0ce11b4cb76885984365900015f0e` (menu), `d03c8d2fb79bc0607fbaa95f288aaf804d8f07de` (sharing).
- Production vocabulary API `https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev/` reported `{"ok":true,"service":"Boring Teacher Vocabulary API","schemaVersion":2}`, supplied by user after deploying V2 Worker. Worker uses `DB` D1 binding; no preservation of legacy data required.
- Published central library in `Educational-Games/main`: `libraries/vocabulary/v1.json` commit `b0f03ad0fae576c5fc4cc2ef97539df82eb4b003`; `libraries/vocabulary/v2.json` commit `6380dd35619afd0348c0590eed4d6754aa3166ec`. V2 has 96 concepts, six languages, 8 categories, 30 ordered language directions; its French/Italian candidate translations still require editorial review.
- Teacher/student URLs use `#set=ID`; menu accepts distinct prompt and target languages, editable title, categories and TAB pairs. User-confirmed working sharing followed import cache busting. No independent automated cross-browser/HTTP suite is claimed.
- Earlier `Educational-Games/word-snake/` file updates are **noncanonical duplicate changes**. Do not assume they are synchronized; compare explicitly before any cleanup.
- Screenshot 2026-10-23 shows approved desktop menu (Spanish → Italian, Colours, 12 pairs). Screenshot was taken before cache fix and shows “Unsupported language”; later user message confirms resolution. Screenshot is visual geometry reference, **not** an error-free release capture.

## New domain standard
See `docs/BORING_TEACHER_WORD_GAMES_MENU_AND_MULTILINGUAL_SHARING_STANDARD_V1_0_2026-10-23.md` for exact Word Snake menu CSS proportions, colours, typography, language semantics, API, student links, cache-busting and porting checklist. It is a **Word Games reference**, not a replacement for the separate Sentence Games Master Menu V1.4 or the arcade homepage standard.

## Operational next steps
1. Align other **Word Games** with accepted Word Snake teacher menu, while preserving each game's mechanics, unique settings, voice, controls and visual gameplay.
2. Treat Cloudflare route-to-origin as mandatory source registry field. Validate dedicated origin before publishing.
3. Pin or review French/Italian translations and maintain source editorial status accurately.
4. Build a reusable word-menu adapter / CSS scoped module with per-game integration tests; avoid copying an entire game into another.
5. Add real HTTP and browser smoke tests for vocabulary library, multilingual category directions, sharing, student mode, cache versions, and gameplay; advisory source audit alone remains insufficient.
