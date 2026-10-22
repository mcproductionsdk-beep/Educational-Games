# V1.7 candidate — validation and editorial changes

**Date:** 2026-10-22  
**Source:** V1.6 candidate on `content/sentence-library-v1-6-corrections`  
**Output:** `libraries/sentences/v1.7-candidate.json`  
**Status:** Development candidate, not published.

## Changes
1. **German / Subordinate clauses / sentence 1:** `Ich weiß dass er kommt` → `Ich weiß, dass er kommt`.
2. **German / Subordinate clauses / sentence 2:** `Sie bleibt zu Hause weil sie krank ist` → `Sie bleibt zu Hause, weil sie krank ist`.
3. **Italian topic key:** `Past subjunctive` → `Imperfect subjunctive`, accurately describing the nine examples of **congiuntivo imperfetto**. Topic remains at the same ordinal position, with the same nine pairs.
4. **Italian / Imperfect subjunctive / sentence 2:** `If I had time I would read → Se avessi tempo leggerei` → `If I had time, I would read → Se avessi tempo, leggerei`.

**Compatibility note:** The Italian topic **key is changed**. Sentence Invaders builds its topic menu dynamically from JSON and therefore can display the new key, but any saved selections, bookmarks, tests, or other game integrations referencing the old key must be checked. Do not update the production library or game code without a separate preview test.

## Automated validation results
- `schemaVersion`: 1 (unchanged).
- Languages: `es-ES`, `de-DE`, `da-DK`, `fr-FR`, `it-IT`.
- Topics: 31 + 23 + 22 + 23 + 24 = **123**.
- Sentence pairs: 279 + 207 + 198 + 207 + 216 = **1,107**.
- Exactly nine two-string pairs per topic.
- No empty strings, malformed pairs or case-insensitive exact duplicates within a locale.
- All locale keys and topic counts preserved; only the explicitly listed Italian topic name changed.

## Pending
- Full native/proficient-speaker line-by-line editorial review remains outstanding.
- Gameplay browser testing, speech, punctuation rendering and Sentence Eater integration are outstanding.
- Production `libraries/sentences/v1.json`, game repositories, D1/Workers and public routes were **not modified**.

**Release decision:** HOLD until preview tests and editorial sign-off.
