# Word Snake — Core migration audit (2026-10-19)

Status: source inspection completed; integration NOT implemented, tested, or released.

## Baseline
- Public game: https://boringteacher.com/word-snake/
- Repository: mcproductionsdk-beep/Educational-Games
- Path: word-snake/index.html
- Title: Word Snake Pixel V2.3
- Original Git blob: 883c827c68c24b5d3152904b3ec11cfee321d8d0
- Development branch: feature/word-snake-core-v1 (created from main; live main unchanged).

## Findings
- Self-contained 30,378-character HTML with inline CSS and IIFE JavaScript.
- Existing teacher menu has language selector, built-in categories, editable tab-separated vocabulary, SWAP SIDES, preview, TEST VOICE and PLAY.
- No Cloudflare API save/load or #set student-link support in this version.
- Game functions include parse, preview, cats, loadCat, start, next, build, move, speak, pause, loop and resize.
- Vocabulary is stored internally as {id,target:pair[0],prompt:pair[1]}. On-screen preview shows pair[1] → pair[0]. **Core expects [prompt,target]**. Explicit orientation mapping is essential to avoid silent inversion.
- Start requires at least five pairs. Wrong words cost lives, correct answers grow snake, edges wrap, rounds accelerate.
- Speech refuses to speak when no matching language voice is installed. Existing Core voice module attempts device speech with locale even without enumerated matching voice. This is a behavior conflict requiring explicit compatibility decision.
- Game uses requestAnimationFrame and keyboard arrows/WASD, P to pause; responsive CSS exists but no touch directional pad was found.
- Current game contains no student-sharing UI; the migration must add teacher/student mode and Cloudflare sharing without affecting game rules.

## Integration boundary
1. Core: parse/validate/normalize vocabulary, locale, teacher/student menu, sharing, voice, lifecycle adapter.
2. Snake: graphics, canvas, movement, food placement, scoring, lives, rounds, pause/restart/fullscreen and audio effects.
3. Do not alter production branch until preview and tests pass.
4. Verify the shared menu's category source; Core menu does not automatically imply Snake's built-in LIB categories.
5. Test share-link loading, language and pair orientation, no teacher controls in student mode, pronunciation matching, and no regressions in snake gameplay.

## Next engineering gate
Build isolated preview using version-pinned Core files, an adapter mapping Core's [prompt,target] to Snake's internal shape, and explicit voice compatibility policy. Execute Core tests and browser acceptance before release.
