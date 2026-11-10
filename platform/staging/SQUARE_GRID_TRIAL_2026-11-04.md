# Snake square-grid trial — 2026-11-04

Owner choices: square cells, adaptive rows/columns, minimum 30 columns and 20 rows, centered full board without cropping or scrolling, grid fixed during a session and recalculated on restart. Movement interval, wrapping, scoring, lives and round acceleration stay unchanged. Adaptive dimensions change travel distances and may change perceived difficulty; owner gameplay review remains required.

Implementation: choose cell size min(available width / 30, available height / 20), then floor the number of whole cells fitting each axis. On resize, use min(new available width / fixed columns, new available height / fixed rows) and center the board. Do not reroll food or mutate logical positions on resize. Start/restart chooses new dimensions and centers the initial snake; losing a life uses the existing session dimensions.

The prior legacy resize deliberately repositioned answers; this is superseded by the owner requirement to preserve the session during resizing. Baseline mechanics tests retain the 30-by-20 reference case. New tests separately verify larger/wider and taller grids, equal cell dimensions, minimum area, preserved snake/answers on resize and recalculation on restart. Browser assertions cover five viewports and rotation.

Engine source: f3fffa1229eccb8b961709fd5de63079e76c7ac0
Engine immutable URL: https://0946e2c6.bt-vocabulary-snake-preview.pages.dev/snake-game.html
Engine build: 47ff0bd62d451b3d6583f7e2655d00a60489d64e
Candidate shell source: 747c19e8545eb30ea5b5fa854b44b7a799e0175b
Candidate shell URL: https://d4be390c.bt-vocabulary-platform-staging.pages.dev/

This is a staging trial, not production approval. Physical-phone legibility, audible speech and owner assessment remain pending. Prior acceptance records certify their named builds only.
