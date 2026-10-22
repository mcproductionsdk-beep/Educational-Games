# Sentence Grammar Library V1.6 — correction log and release status

**Date:** 2026-10-22  
**Candidate:** `libraries/sentences/v1.6-candidate.json`  
**Derived from:** `v1.5-candidate.json` on `content/italian-nine-per-topic-v1-5`  
**Status:** Corrected editorial candidate; **not approved for production**.

## Applied corrections (13 sentence pairs)

| Locale | Topic | Position (1-based) | Correction |
|---|---|---:|---|
| fr-FR | Direct object pronouns | 4 | Changed `en` example to `Nous les voyons` |
| it-IT | Direct object pronouns | 9 | Replaced indirect-experiencer `ci è piaciuto` with direct-object `lo abbiamo rivisto` |
| it-IT | Past subjunctive | 4 | Replaced unnatural `Ci ha chiesto che aspettassimo` with `Voleva che aspettassimo` |
| da-DK | Reflexive verbs | 7 | Replaced non-reflexive `Kan du huske turen?` with `Hygger du dig?` |
| it-IT | Ci and ne | 4 | Replaced contextless `Ne viene` with an explicit coffee antecedent for `ne` |
| es-ES | Direct object pronouns | 7 | Removed indirect-object combination to focus on `las` |
| de-DE | Genitive case | 9 | Removed an extra possessive while retaining `des Museums` |
| fr-FR | Imparfait | 4 | Added a background event to clarify imperfect aspect |
| it-IT | Questions | 1 | Added question marks |
| it-IT | Questions | 2 | Added question marks and disambiguated present progressive meaning |
| it-IT | Present tense | 1 | Aligned natural partitive phrase `del pane` with English prompt |
| fr-FR | Subjunctive | 5 | Aligned English prompt with impersonal French necessity |
| it-IT | Present subjunctive | 5 | Aligned English prompt with impersonal Italian necessity |

## Audit corrections and accepted examples

The previous V1.5 audit included two incorrect location references:
- **French / Y and en pronouns / 5** was identified as `She comes from there → Elle en vient`, but actual pair 5 is `I have three of them → J'en ai trois`. The original problematic pair is **not present at that location**, so no change was made.
- **Danish / Articles and gender / 9** was described as `Et lille barn giver kvinden en blomst`, but actual pair 9 is `The old house has a large kitchen and a small bathroom → Det gamle hus har et stort køkken og et lille badeværelse`. It was retained as a plausible application-stage example.

**Spanish / Articles and gender / 3** (`El libro es interesante`) was retained: it demonstrates the masculine definite article, although topic-wide scaffolding remains an editorial question. Other grammatical examples noted as complex but valid were not rewritten solely to shorten them.

## Automated validation

- Five locales: es-ES, de-DE, da-DK, fr-FR, it-IT.
- 123 topic entries and **1,107 sentence pairs** total.
- Exactly nine `[English, target]` pairs per topic.
- No empty entries, invalid pair shapes or exact case-insensitive duplicate prompts/targets within a language.
- No changes to the schema, locale keys, topic names, topic counts, or sentence positions.

## Outstanding release gates

1. Conduct a systematic sentence-by-sentence native/proficient-speaker linguistic review; the previous audit documented specific findings but did **not** certify every pair.
2. Review grammar-topic focus, translation ambiguity and the 3+3+3 stage progression for each topic.
3. Test all five languages and the revised sentences in the game preview, including apostrophes, punctuation, contractions, answer generation and TTS.
4. Publish an **immutable** approved content release only after acceptance, then update game library URLs in a separate reviewed change.
5. Keep production `libraries/sentences/v1.json` unchanged until migration approval.

This branch changes **educational content only**. No game code, D1 databases, Workers, routes or student-sharing contracts were modified.
