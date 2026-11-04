# Published Word menu → central staging restoration — 2026-11-04

Reference source: Educational-Games/main/index.html at 481b84ab39f076f0b13192c8c9a26478e92ffb5c; blob 3a576beeaacb18570ee16ba8e210f190be9310e9. This is the registered published homepage source. Direct HTTP fetches of boringteacher.com and its GitHub Pages origin returned 403 from the execution environment, so this work does not certify a newly fetched live homepage byte match.

The simplified pilot was not the published menu and was not extracted from Snake. The staging replacement preserves the registered published Word interface instead of promoting that simplified launcher into the product.

| Published feature | Central staging treatment |
|---|---|
| Boring Teacher arcade header and family tabs | Source CSS/layout reused; clear staging label; Word enabled, other families marked not yet migrated |
| Two-column Game Settings / Customize-Edit | Preserved, responsive single column on phones |
| Explicit prompt and target locales | Preserved through the existing runtime validator |
| Editable category vocabulary | Same central catalog source; category list derived rather than hardcoded to exactly eight categories |
| Tabs, pipes, spaced dashes, semicolons and arrows | Delimiter precedence preserved in central parser; invalid rows reported |
| Check Import, Clear and Swap | Restored centrally; malformed rows cannot be silently discarded by swapping |
| Word preview with pronunciation per column | Restored through the same central speech service used by gameplay; touch targets enlarged to 44px |
| Student Link below its own button with automatic copy | Restored; failed clipboard copy retains visible URL and honest fallback |
| Save to Folder prototype | Restored as browser-local staging-only save/load; no account or cloud-sync claim; separate bt-staging-word-sets-v1 namespace |
| Eight Word game cards | Preserved visually; only Snake enabled, seven show not-yet-migrated state; no staging escape to production games |
| Student selector | Same eight-card structure; no teacher editor; only compatible migrated Snake enabled |

Intentional constraints: title limit 100 and play/share minimum five pairs match the inspected sharing API and Snake contract; preview can inspect fewer pairs. Full Sentence workflow is not migrated or silently redirected to production. Conjugation/Communication remain unavailable. These boundaries are stated in the interface; this is not full root-homepage replacement acceptance.

Integration corrections: student snapshot loading no longer depends on category catalog availability; catalog failure still permits custom teacher input. Main Menu remains operable after game startup errors. Sound preference lasts for the current central page session across game replacement; restart preserves it, full page refresh returns to on, and content language metadata remains authoritative. Speech cancellation clears displayed speaking status.

Engine unchanged: 431dd74e249711b72a8cdb1448f9483014bd774b, build c633cb915e402af01d9d36e4c3f280b58e8b4e0f, immutable engine origin https://87e18652.bt-vocabulary-snake-preview.pages.dev.

Central application artifact under verification: https://37f05767.bt-vocabulary-platform-staging.pages.dev/ at 221c8a857d01b5a16e402691f8d2a7449c3b9e50. Local contract checks: 23 passing. Browser outcome must be taken from workflow evidence, not deployment success.

Remaining gates: physical desktop/mobile visual and audible acceptance, unavailable-service and clipboard-denial regression expansion, engine direct-visit fallback, required release packaging/CI, final approved central registry architecture and production-specific configuration. No gameplay, public source branch, routes, APIs, databases or bindings changed. No production approval implied.
