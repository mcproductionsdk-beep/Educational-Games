# Snake viewport and shared-interface correction — 2026-11-04

Owner reported duplicated titles, scrolling gameplay, clipped snake/prompt and residual engine menu code.

Changes:
- During play, central launcher hides its homepage header and owns one viewport-sized game shell with one title and common action bar. Creator menus retain ordinary document scrolling.
- The iframe consumes remaining flex space; no forced 520px minimum or unrelated TEST VOICE row below gameplay.
- Snake owns only its HUD, board, feedback overlays and unique steering controls. Removed engine title, hidden language form, common action buttons, game-over navigation buttons and fullscreen/menu handlers and styles. Shared shell still owns Pause/Resume, Restart, Main Menu and Sound.
- Canvas dimensions use the board client area, excluding borders. Prompt next to the snake clamps horizontally and moves above the head near the bottom edge. Logical grid, wrapping, movement timing, scores, lives and rounds are preserved.
- Touch targets remain at least 44px; short landscape layouts use a single steering row. Coarse-pointer devices retain steering controls in landscape.

Engine artifact: https://55f36a28.bt-vocabulary-snake-preview.pages.dev/snake-game.html
Engine source: 322724b54c70eb45e56136cd04ab33f25c319666
Engine build: 2461bb11ad8f4d27bf833cbc6003230998f7e585
Shell artifact under verification: https://bcf916e7.bt-vocabulary-platform-staging.pages.dev/
Shell source: 3fec75eb5af7fc22d2ff15d1c8091e8142a99a2c

Exact legacy DOM/geometry parity is intentionally superseded by this owner-requested layout correction. Baseline mechanics comparisons remain. New browser acceptance checks require viewport-contained board/canvas/HUD and no engine menu elements at five sizes. Unit coverage checks prompt placement at all four board corners. Integrated live checks additionally require one visible title and no document scroll; their outcome must be taken from the corresponding workflow, not inferred from deployment success.

Previous acceptance records apply to previous builds only. Physical touch, audible pronunciation and owner visual acceptance remain pending. This correction is not production release approval. Main/develop branches and public routes were not changed.
