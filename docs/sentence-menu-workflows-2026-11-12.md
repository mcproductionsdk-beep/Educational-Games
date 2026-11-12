# Sentence menu restoration — staging

Restores audit F04's missing Sentence Save/Load and Swap controls in the shared
workspace. Engine files, gameplay, APIs, production origins and Word saving are
unchanged. This is not a production release.

## Direction contract

The editor declares English-first or target-first column order. Swap reverses
the displayed text and its order declaration together. Changing the order
selector alone lets a teacher identify the English column in pasted text.
Parsing always produces canonical `[English,target]` pairs. Preview pronunciation
uses `en-US` and the selected target locale. Games still prompt in English;
the Sentence API still receives `[target,English]`. This does not claim reverse
translation gameplay or automatic language detection.

## Browser-local saving and compatibility

- `bt-staging-sentence-sets-v1`: versioned array of local Sentence sets with
  title, locale, canonical pairs, folder label, date and editor order.
- Save and Load remain local to the exact browser origin. Load restores the
  same set to the editor and all four game choices. Malformed storage is
  reported and never overwritten. No account, cloud folder or sync is implied.
- `bt-sentence-universal-preview`: older unversioned draft can be explicitly
  imported when present on the same origin. The teacher identifies its English
  column. Import leaves the old record intact; it is not automatic migration.
- `bt-word-sets-v1` and `bt-staging-word-sets-v1` are untouched. Existing Word
  draft compatibility remains a public-release gate, not a completed fix here.

Before public cutover, build and test on the existing public origin using a
disposable browser profile containing both legacy draft formats. Add an opt-in,
idempotent Word import that validates existing fields and preserves the original
key. Verify Sentence legacy import with both possible column orders. Retain old
keys during rollback; never replace them with staging data. A Cloudflare preview
cannot access drafts saved on boringteacher.com, and changing origins does not
transfer local storage. Any cross-origin transfer needs an explicit export/import
workflow rather than a claim that existing drafts migrated automatically.

## Validation boundaries

Node contract tests cover all five target locales, both column orders, persistence,
storage corruption and exact API direction. Browser tests cover swap, four game
launch contracts, reload/load, legacy import, denied storage, clipboard failure
and student-only controls on desktop and portrait. Record actual CI outcomes in
the PR; adding a test is not evidence that it passed. Deployed smoke checks do
not replace physical-device or audible pronunciation acceptance.
