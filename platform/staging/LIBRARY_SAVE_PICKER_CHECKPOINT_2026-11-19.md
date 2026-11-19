# Unified saving and set actions — 19 November 2026

Scope: dedicated staging only. Supersedes the two parallel save controls in the preceding library explorer. The owner also requested double-click opening in another tab and a right-click menu with Rename, Edit and Copy share link. “Another tab” is implemented as a new browser tab.

## Behavior

Both Word and Sentence editors now expose one SAVE TO FOLDER button. It saves to the authenticated private account. The obsolete local-only dialog/handlers are removed from these editors. Existing browser-local records are not deleted, overwritten, read into the cloud or automatically imported. Exported legacy Sentence storage helpers remain for compatibility; no local-save button is advertised as cloud saving.

The save dialog shares the library explorer's icon renderer, nested-folder tree, breadcrumbs and tile styling. Select a destination on the left or open a folder tile. Existing sets are displayed for reference and cannot be selected as overwrite targets. The footer shows the current set and full destination. New folder creates a child of the current destination and selects it. Saving updates only the explicitly opened record, or creates a new record/copy when requested. Cancellation, authentication failures and failed saves retain the editor. Stable creation retry keys survive a lost acknowledgement so retrying does not duplicate a saved set.

The library opens a set in a new browser tab on double-click or Edit/Open in editor, preserving the source workspace and its dialog/draft. The new URL uses an opaque private set UUID in a fragment; no payload, account ID, credential or token is put in the URL. The new tab refreshes account state and fetches the owner-checked private record. Knowing the UUID is not authentication or sharing permission. Invalid, foreign/missing or signed-out requests do not reveal the private content.

Right-click a set, use Shift+F10/the context-menu key, or select Set actions on a phone to access Rename, Edit and Copy share link. Rename fetches the current saved payload and changes only its title with the current optimistic revision. Copy share link fetches the saved record and explicitly creates a student-safe snapshot through the existing family-specific sharing API. Word sharing preserves prompt/target locales; Sentence sharing uses the established target/English API conversion. Private ownership/metadata is excluded. Earlier public snapshots are not changed. Clipboard success is reported only if copying succeeds; otherwise the new link is displayed for manual copying. The previous copied link is cleared while a different snapshot is being created.

## Isolation and recovery

Baseline website code: 55273bfae74de83652c516a69feb6ab83e08f1a8. Work is isolated on feature/library-save-picker-20261119. No main/develop movement, authentication-provider change, new service, paid plan, Worker upload or schema migration is required. The existing Accounts API and migration 8 remain in place. Website rollback can return feature/accounts-ui to a reviewed release of the preceding code without changing any saved data.

## Verification boundaries

Local: all 35 website Node tests and the staging build passed. Browser CI exercises both editors at desktop and phone-sized viewports, one save button, the explorer picker, folder creation, destination navigation/cancellation, preserving legacy storage, a lost-acknowledgement retry, updates, Save as new, failed-save drafts, rename, both family share payloads/links, a real new browser page with no opener, preserved source draft, nested folders/dragging/mobile moves, Trash/restore, sign-out and expired-session sign-in. Exact final CI, screenshot review, deployment and live guest smoke evidence are recorded below after completion.

These are synthetic browser fixtures and source/deployment checks, not owner acceptance of the new signed-in flows or physical-device testing. The previous cloud-saving acceptance remains recorded in the backend explorer checkpoint. Production remains outside this change.

## Completed staging evidence

- Runtime website code: 04e19b146f7512839e8d241e837a6861257582e2.
- Passing CI: https://github.com/mcproductionsdk-beep/Educational-Games/actions/runs/44555807750. All 35 Node checks, account/login/registration/profile browser checks, the expanded library tests and the actual pinned game shell passed.
- Screenshots: artifact 14545511419, reviewed at 1280×900 and 390×740. The shared folder explorer and the save picker were both captured. This is synthetic test content, not real account data.
- Earlier CI exposed a stale prior share-link success during creation of another link and a closed-dialog visibility race. Both were fixed before this candidate passed. No failing candidate was promoted.
- Pages deployment de10a98b-c247-41c8-89ca-e158abc891e4 succeeded at 2026-11-19T15:34:10Z. feature/accounts-ui was fast-forwarded from the recorded baseline to the passing candidate with an expected-head lease and force=false; main/develop were not moved.
- Accepted staging URL: https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/
- Live browser: both editors exposed exactly one SAVE TO FOLDER and zero SAVE TO ACCOUNT buttons. The Word save opened the new explorer picker; guest sign-in was required and saving stayed disabled. version.json independently returned the exact candidate SHA.
- An initial inspection saw the new button alongside the prior save dialog. After a fresh navigation the correct new dialog was observed. The exact cause of that transient delivery discrepancy was not established; do not claim a diagnosed cache defect. Direct .mjs navigation was blocked by the cloud browser; no browser security setting was changed.
- Live signed-in picker/menu/new-tab acceptance remains pending. No real-account shares, credentials, private payload inspection, database migrations, Worker uploads, billing changes or production release were performed during this UI change.
