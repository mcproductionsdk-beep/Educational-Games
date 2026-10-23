# BORING TEACHER — WORD GAMES MENU & MULTILINGUAL SHARING STANDARD V1.0
Date: 2026-10-23
Status: User-accepted Word Snake reference for future **Word Games**. Sentence Games Master Menu V1.4 remains separately authoritative.

## Accepted release
User confirmed Word Snake worked after module cache-busting fix. Canonical public URL: https://boringteacher.com/word-snake/ . Cloudflare routes this game to dedicated `mcproductionsdk-beep/Word-Snake` main, **not** the copy in `Educational-Games/word-snake/`. The supplied screenshot shows Spanish prompt → Italian target, Colours, title, 12 pairs, swap/share/play; the screenshot's “Unsupported language” error was resolved subsequently. Preserve game logic in `snake-game.html`.

## Freeze exact effective menu appearance
Authoritative implementation: `Word-Snake/styles/menu.css` and `core/menu.js`; compare at identical viewport and zoom. Effective `.bt-core:has(.warehouseCols)` background `#10192e`, no border/shadow, max-width `1050px`; parent `#app` max-width `1100px`, margin `8px auto`. `.warehouseCols` is a desktop two-column grid `1fr 1.25fr`, gap `12px`, settings left / vocabulary right. `.warehousePanel`: background `#233958`, text `#f8f8ff`, border `3px solid #7bbaf3`, padding `15px`, shadow `5px 5px #050b17`. Headings `18px #ffe082`; labels/help `#bfd3ed`. Monospace `Courier New`. Select and textarea background `#f5f8ff`, border `3px solid #10192e`, text `#18243b`; base input font bold 14px and 9px padding. Textarea height `220px` (mobile `170px`), vertically resizable. Yellow buttons `#ffe082`, dark border `3px solid #121e34`, dark text `#14243d`, shadow `3px 3px #050d1c`. Actions flex row, gap `8px`, wrapping, order Swap Sides / Share with Students / Play. At `max-width:760px` stack columns, actions full width, controls at least 48px high. The CSS includes earlier Word Racer rules: use **effective warehouse selectors/cascade**, not arbitrary first declarations. Screenshot physical width is not CSS pixel width.

## Functional contract
Six locales: English en-US, Spanish es-ES, German de-DE, Danish da-DK, French fr-FR, Italian it-IT. Independent prompt and target selectors; cannot select identical locale. Editable title and TAB-delimited vocabulary, **[target,prompt]** columns; built-in category and editable custom pairs; preview count and visible validation errors. Swap Sides swaps **both** columns and selected language values. Test Voice uses target locale. Built-in library: `https://boringteacher.com/libraries/vocabulary/v2.json`, 96 concepts, eight categories, twelve pairs each, 30 language directions. Fallback `/libraries/vocabulary/v1.json` with English prompts. V2 file still identifies French/Italian translations as development candidates pending editorial review: publication is not translation certification.

Production API: `https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev` schemaVersion 2; POST `/sets` and GET `/sets/{id}`, D1 `DB`. Payload `{title,language,promptLanguage,pairs}`. Student links use canonical game URL `#set=ID`; student view shows title, language direction, pair count, Play, instructions, without teacher editing. Historical set preservation is unnecessary per user. Preserve per-game TTS, gameplay, scoring, controls, and existing message/event protocols.

## Cache and release rule
“Unsupported language” after release was fixed by cache-busting **transitive ES module imports** in `index.html`, `core/menu.js`, `core/sharing.js` (`?release=multilingual-20261023b`). Version every changed import edge. Do not claim published from a GitHub commit alone: verify actual Cloudflare origin, public HTTP, live student link and user acceptance.

## Replication sequence
1. Inspect each game's actual Cloudflare route, source repo, dependencies and preserved mechanics.
2. Capture current game and approved Word Snake desktop/mobile menu before editing.
3. Port **menu-scoped** layout, language selectors, title, category, editable pairs, swap, sharing, voice and student view. Adapt game start payload rather than copying Word Snake gameplay.
4. Use central V2 library and production API, retain V1 fallback, ensure Unicode and language direction.
5. Cache-bust all changed modules; test desktop at matched viewport/zoom and mobile at 760px.
6. Verify category, custom pairs, swap, six languages, TTS, share POST, student GET, Play, pause, restart, return and error handling.
7. Log canonical route, commit, CSS reference, screenshot, HTTP/browser evidence, and explicit acceptance.
