# Catalogue review and physical-device sign-off — 2026-11-12

Status: catalogue revisions approved for release preparation under the owner's instruction. No production publication or cutover authorized. Physical-device and audible-voice evidence pending.

## Editorial scope

Reviewed all 101 Word concepts across English, Spanish, German, Danish, French and Italian, and all 1107 Sentence pairs across 123 topics (ES 31, DE 23, DA 22, FR 23, IT 24). Each Sentence topic retains nine examples and its original order. This is an AI editorial review, not native-speaker certification or a claim that every translation is uniquely correct.

Word V2: no lexical changes approved. Preserve valid regional variants. Broad prompts such as “to play” remain context dependent (Danish lege/spille); teachers should select the intended sense for their lesson. French and Italian have been reviewed here, but no human native-language validation is claimed.

Sentence V1.8: 18 rows revised. Exact before/after pairs are recorded in release/production/catalogue-revisions-2026-11-12.json. Restore question punctuation in ES/DE/DA/FR, German relative-clause commas, the Spanish direct-object example, French reflexive/pronoun examples, German small/young alignment, Danish “know it” alignment, and actual skal examples in the vil/skal topic. No bulk paraphrasing, sentence count changes, or punctuation stripping.

## Candidate identity

This review is stacked on production package PR9, commit 11594b8bf268adc69b85b70252095e07496d5734. Source catalogues remain immutable at their old Git commit. The new candidate changes the Sentence catalogue and explicitly pins that revision in release/production/sources.json; production settings record editorial review separately from hardware/voice approval. Rebuild and CI are required after changing source pins. Existing package artifacts are superseded for catalogue approval; do not deploy the older artifact as the revised candidate.

## CI evidence

Production package baseline: run 43281419850 succeeded, including all twelve games in desktop/portrait browser emulation, menu handshake, Pause/Restart/Menu, direct/foreign-parent gating, mocked shared-set API workflows, syntax/integrity and negative configuration/tamper checks. This establishes no physical-device or audible result.

Refreshed engine lifecycle runs: Cat 43282624082 passed; Invaders 43282652998 passed. Eater and Warehouse preview harness failures were identified and repaired: allow lifecycle.js in Eater's deny-network route; let Warehouse's initial floor clamp settle before measuring keyboard-scroll position. Latest reruns must pass before CI gate closes. No gameplay code was changed for these harness repairs.

## Physical testing — Apple Safari AND Android Chrome

Owner has both platforms. Record device model, OS/browser version, date, tested deployment URL and candidate commit. Do not mark results from browser emulation as device passes. Run the exact revised candidate once its deployment is available. The older staging menu at https://4e678cbe.bt-vocabulary-platform-staging.pages.dev/ is a baseline only and does not contain these new editorial revisions.

For every game on both devices (Snake, Racer, Jumper, Invaders, Frog, Match, Eater, Warehouse; Sentence Cat/Eater/Warehouse/Invaders):

1. Open a fresh student shared-set link, then separately open the teacher menu. Confirm correct set/language, readable prompt and targets, and no sample/menu flash.
2. Play in portrait and landscape; rotate during play. Confirm no clipping, page scrolling trapping controls, hidden buttons, or unreadable long words/prompts. Exercise the actual per-game touch controls; Eater swipe-to-move/tap-to-stop and Warehouse tap anywhere to catch/drop must work.
3. Pause, resume, restart and return to menu; confirm set/language retention and no duplicate game loops. Background the browser or lock the screen during movement and during speech. Sentence games must remain paused until explicitly resumed.
4. Save/load a local folder set and create/reopen a shared link; check teacher controls are absent in student mode. Test private browsing separately if local storage availability matters; report unsupported storage clearly.

## Audible speech — real speakers/headphones

On each device, select the intended language/voice, tap pronunciation in both prompt and target columns, then collect a correct answer in each game. Confirm actual audible output, language, word/sentence content, and no overlap. Check available target languages ES/DE/DA/FR/IT; English prompt pronunciation is separate. Voice availability depends on the device, so record the selected voice name and missing locales rather than assuming them.

Useful accented phrases: ES “¿Dónde vives?”; DE “Die Bücher sind hier”; DA “Rød grød med fløde”; FR “Où habites-tu ?”; IT “Perché impari l'italiano?”. Use a short complete Sentence set and a long prompt in addition to these voice samples.

During speech, press Pause, Restart, Main Menu and Sound Off separately. Background/lock the device while speech is playing. Confirm cancellation, no stale speech after navigation, and no automatic Sentence resume on returning. Confirm speech can start again after an explicit user action. Judge pronunciation by listening; speech events alone are insufficient.

## Result record

| Gate | Status | Required evidence |
|---|---|---|
| Catalogue revisions | Approved for release preparation | 18-row revision log; reviewed counts above |
| CI on revised candidate | Pending | Latest commit and all relevant successful run URLs |
| Apple device | Pending | Model/OS/Safari, candidate URL, twelve-game results |
| Android device | Pending | Model/OS/Chrome, candidate URL, twelve-game results |
| Audible voices | Pending | Per device/locale voice names and heard results; cancellation checks |
| Production cutover | Not authorized | Separate release review after remaining audit gates |

Record failures with game, device, orientation, steps, expected/actual result. A missing voice is an unresolved release limitation until explicitly accepted. No hardware or audible pass has been recorded as of this document.
