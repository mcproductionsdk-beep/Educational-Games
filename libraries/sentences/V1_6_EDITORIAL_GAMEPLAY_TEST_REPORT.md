# V1.6 Editorial and Gameplay Compatibility Test — 2026-10-22

**Candidate:** `libraries/sentences/v1.6-candidate.json`  
**Game source inspected:** `mcproductionsdk-beep/Sentences-Invaders/index.html` (default branch).  
**Test method:** Static source inspection + exhaustive JSON/token-level simulation, **not** a browser playthrough. Sentence Eater code was **not** inspected in this pass.

## Results

| Gate | Result | Evidence |
|---|---|---|
| JSON schema and topics | **PASS** | 5 locales, 123 topics, 1,107 pairs, nine pairs per topic; schemaVersion 1 |
| Empty/duplicate strings | **PASS** | No empty pairs, malformed entries or case-insensitive exact duplicates within a locale |
| Sentence Invaders loader shape | **PASS (static)** | Loader expects schemaVersion 1, five locale keys, nonempty topic arrays of `[English,target]` strings. V1.6 satisfies these checks |
| Sentence Invaders word assembly | **PASS WITH WARNINGS** | Space-based tokenization generates words for every sentence; commas and semicolons remain attached to tiles; trailing `? ! .` is stripped |
| In-game distractor creation | **PASS (static logic)** | `makeSentence` builds waves from target-language words only, plus pool from current locale. Correct word always occupies one of four slots if pool is large enough |
| Punctuation preservation | **FAIL for faithful written reproduction** | The game strips sentence-final punctuation and keeps interior punctuation attached to words; completed sentence may omit final question marks |
| Foundation / Development / Application delivery | **NOT IMPLEMENTED** | Content order is 3+3+3 editorial only. Game does not display or enforce stages; replay follows original array order |
| Voice correctness | **UNVERIFIED IN BROWSER** | Speech synthesis uses locale prefix; available browser/OS voices determine actual accent |
| Sentence Eater compatibility | **NOT TESTED** | No code fetched or executed |
| Live deployment | **UNCHANGED** | Sentence Invaders still fetches `https://boringteacher.com/libraries/sentences/v1.json` |

## Exact punctuation exposure by locale

A sentence is counted if its target-language text contains an internal token ending with `, ; : ! ?`, including commas/semicolons attached to words. Counts are **sentence counts**, not errors in the source language.

| Locale | Sentences with punctuation-attached tokens | Sentences containing internal `? ! ; :` | Sentences containing apostrophes | Sentences longer than 18 space-separated tokens |
|---|---:|---:|---:|---:|
| es-ES | 31 | 1 | 0 | 0 |
| de-DE | 30 | 0 | 0 | 0 |
| da-DK | 29 | 0 | 0 | 0 |
| fr-FR | 34 | 3 | 62 | 0 |
| it-IT | 25 | 4 | 21 | 0 |
| **Total** | **149** | **8** | **83** | **0** |

Apostrophes (e.g. `l'école`, `l'ho`) stay inside a tile; this is generally appropriate for word-selection gameplay but should be tested with TTS and rendering. Interior punctuation is likewise a *display concern*, not automatically a grammatical mistake.

### Eight examples requiring manual UI review

- es-ES / Direct object pronouns / 8: `No encuentro mi cuaderno; lo dejé en el colegio`
- fr-FR / Direct object pronouns / 8: `Je ne trouve pas mon cahier ; je l'ai laissé à l'école`
- fr-FR / Y and en pronouns / 6: `Tu penses à tes vacances ? Oui, j'y pense`
- fr-FR / Y and en pronouns / 7: `Tu veux du pain ? Oui, j'en veux`
- it-IT / Direct object pronouns / 8: `Non trovo il quaderno; l'ho lasciato a scuola`
- it-IT / Ci and ne / 4: `Vuoi del caffè? Sì, ne voglio`
- it-IT / Ci and ne / 6: `Pensi all'esame? Sì, ci penso`
- it-IT / Ci and ne / 7: `Vuoi del pane? Sì, ne voglio`

## Editorial issues found during testing

1. **German seed punctuation**: `Ich weiß dass er kommt` and `Sie bleibt zu Hause weil sie krank ist` (Subordinate clauses, positions 1–2) require commas before `dass` / `weil`.
2. **Italian category naming**: `Past subjunctive` topic uses `venissi`, `avessi`, `fosse`, `aspettassimo` (congiuntivo imperfetto), not primarily `congiuntivo passato` (e.g., `sia venuto`). Rename to `Imperfect subjunctive` only with coordinated UI/topic-key migration, or adjust topic content; do not silently rename because game selects topics by exact key.
3. **Italian category focus**: `We watched the film yesterday and watched it again today` has direct object `lo`, but it is comparatively long; acceptable at Application stage with scaffolding.
4. **French pronoun context**: `en` / `y` often needs explicit antecedents. Two-clause question-and-answer prompts supply this context but currently create punctuation-bearing tiles.
5. **Question punctuation**: `tokenize` strips sentence-final `? ! .` in all locales; Sentence Invaders displays an unpunctuated completed sentence, even for interrogatives. This is a game display issue; do not remove correct source punctuation.
6. **Progression not a game mode**: 3+3+3 order is preserved in JSON, but no explicit difficulty stage is surfaced in Sentence Invaders. The game may still use all nine sequentially; verify via UI.

## Release recommendation

**HOLD.** Structural and loader compatibility tests pass, but this is **not** a verified browser playthrough, and no native-speaker line-by-line sign-off has been performed. Correct German punctuation in a follow-up candidate, resolve the Italian subjunctive label, and run browser tests for all five locales (including each of the eight flagged examples). Test Sentence Eater separately before enabling V1.6 there.

No game code or live production JSON was changed.
