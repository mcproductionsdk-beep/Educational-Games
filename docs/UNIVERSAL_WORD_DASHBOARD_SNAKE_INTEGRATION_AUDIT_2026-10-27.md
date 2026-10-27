# Universal Word Dashboard — Word Snake integration audit
Date: 2026-10-27
Status: Development branch only; no production changes

## Confirmed architecture
- Homepage repository: mcproductionsdk-beep/Educational-Games.
- Canonical Word Snake source: mcproductionsdk-beep/Word-Snake/main (separate repository).
- Word Snake index.html imports core/menu.js, core/sharing.js, core/voice.js, and core/multilingual-vocabulary-v2.js.
- Existing Word Snake start(vocabulary) passes vocabulary into snake-game.html through BT_SNAKE_START postMessage after BT_SNAKE_READY.
- Existing production vocabulary API: https://boringteacher-vocabulary-api.mcproductionsdk.workers.dev
- Existing central multilingual library: /libraries/vocabulary/v2.json, schemaVersion 2.

## Safe implementation plan
1. Publish approved Dashboard V1.5 as a separate prototype HTML file on this development branch; do not overwrite index.html.
2. Verify the complete game vocabulary payload expected by Word Snake's start(vocabulary), including pair order and language metadata, before implementing an adapter.
3. Add a dedicated, validated launch mode to canonical Word-Snake on its own development branch; keep teacher and student menus as fallback.
4. Connect the dashboard's Snake icon to the launch mode.
5. Test English→Spanish, Spanish→English, alternate languages, built-in and custom sets, audio, gameplay, restart, and return navigation.
6. Only then plan integration of the other seven games.

## Safety
Do not modify the live homepage or production Word Snake until tests pass.
Do not claim that an uncommitted local HTML prototype is deployed.
Do not invent share URLs: use the existing API's real create/read contract.
