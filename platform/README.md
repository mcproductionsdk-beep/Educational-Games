# Central vocabulary runtime pilot

Isolated feature increment. No production entry imports these files. No staging or production config is supplied; no service/store is provisioned. Existing root and legacy core files remain unchanged.

- config.mjs validates the full config/registry combination against an independently supplied deployment policy before returning service access. Staging rejects known production origins and all URLs outside exact allowlists.
- content.mjs preserves explicit promptLanguage and [prompt,target] ordering. Legacy missing prompt metadata defaults to en-US only through loadSet's compatibility boundary. Sentence-family content is rejected.
- runtime.mjs provides validated public vocabulary reads/publishes using existing API fields, 12-second cancellation, redirect rejection and omitted credentials. Sharing must be explicitly disabled with null or configured through approved staging policy. No API default exists.

Run: node --test platform/tests/*.test.mjs

Tests use spies/mocks, not real staging writes. They demonstrate request construction and fail-closed configuration; they do not certify a deployed preview, browser CSP, isolated D1 storage, server-side authorization, central menus or audible speech. Exact engine URL/build pairs are trusted deployment allowlist entries; their deployment provenance must be verified separately.

Consumer supplies trusted policy separately from config; never build either from student URL/query/set data. Production-capable deployment settings are not bundled in this increment. The current pilot registry accepts only vocabulary-snake deliberately; other games require individual migration.

Content/string limits remain pending verified API limits. The prototype is not a production-ready general network sandbox or a private library. Existing production public endpoints may accept manual external requests; CORS and browser configuration do not establish backend authorization.

Source base: Educational-Games 481b84ab39f076f0b13192c8c9a26478e92ffb5c. Detailed migration design lives in Vocabulary-Snake draft PR #1, docs/SNAKE_INTEGRATION_DESIGN_V0_1.md.

## Central gameplay-shell increment

shell.mjs mounts the shared four-action bar around the approved engine frame. It validates configuration and content before assigning the frame URL, uses correlated session commands, returns a guest to the same set ID, and requires a creator-return callback for an existing creator workspace. Failed initialization shows an error and Retry (reload); there is no fabricated vocabulary fallback.

session-client.mjs validates the exact engine window/origin, protocol, build, session, acknowledgement and state. It times out and removes failed frames, ignores stale replies, cancels pronunciation on lifecycle changes, and distinguishes focusing the child frame from leaving the application. The trusted registry/build policy is still supplied by the deployment bootstrap, not URL data.

voice.mjs is the single pronunciation implementation used by TEST VOICE and answer events. It normalizes voice locale separators/case, chooses exact then base-language voice, requests browser speech even with an empty voice list, and reports requested/started/ended/error without claiming audible output. Gameplay requests use the bound snapshot locale and must match an answer in that snapshot.

The opt-in shell mode hides Snake's common title/actions while retaining its canvas, HUD, prompt and directional controls. Legacy baseline mode remains unchanged. The central application must load shell.css once; no common UI/CSS or speech implementation is copied into Snake.

Browser test: prepare-engine.py downloads an immutable engine test dependency with SHA-256 checks. shell-browser.mjs serves it and the actual central shell on separate loopback origins, intercepts sharing responses, fixes rendering time for deterministic injected answer steps, and instruments browser speech. Test hooks are injected into served responses only. Tests are not performance measurements, physical-device evidence or real service/storage integration.

The full teacher editor/student game picker/catalog refresh workflow and deployed sharing service remain outside this increment. Browser preferences, production release packaging/CSP and physical-device fullscreen/audio acceptance are still pending. Do not activate a public route from these tests.
