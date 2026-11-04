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
