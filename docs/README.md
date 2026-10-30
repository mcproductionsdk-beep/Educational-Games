# Boring Teacher — current documentation map (2026-10-30)

> **CURRENT-STATUS OVERRIDE:** This introduction supersedes stale version references and the historical 2026-10-25 entry point preserved below. The *full canonical standards* are maintained as separate ChatGPT Language Games Project documents; the new versions have been prepared for Project upload and should not be claimed active there until actually uploaded and verified.

## Read current documents in this order

1. **Source of Truth V21** — `BORING_TEACHER_SOURCE_OF_TRUTH_V21_WORD_SNAKE_AND_BRANCHING_2026-10-30.md` — universal set-first homepage, confirmed Word Snake production, and current branch rollout status.
2. **Canonical Source Registry V1.6** — `BORING_TEACHER_CANONICAL_SOURCE_REGISTRY_V1_6_2026-10-30.md` — verified source/branch inventory and routing caveats.
3. **NEW Game Adapter Migration & Branching Standard V1.0** — `BORING_TEACHER_GAME_ADAPTER_MIGRATION_AND_BRANCHING_STANDARD_V1_0_2026-10-30.md` — direct-play architecture, `develop`/release/recovery and migration acceptance.
4. **Development Standards V4.4** — `BORING_TEACHER_DEVELOPMENT_STANDARDS_V4_4_2026-10-30.md` — required release/branch/protection gates (preserves V4.3 and predecessors).
5. **Documentation Entry Point 2026-10-30** — `Boring_Teacher_Documentation_Entry_Point_2026-10-30.md` — reading order and version/retention protocol.
6. **Retained specialist standards:** Universal Homepage & Menu V2.1; Universal Set Editor & Sharing V2.1; Sentence Games Menu & Sharing V1.5; Voice Routing V1.1; Grammar Library V0.4; Personal Library & Accounts V1.0.

**Live milestone:** Word Snake, `Word-Snake/main`, PR #2 merged 2026-10-30 at `176b348a`. Its public game is user-confirmed, with no duplicate teacher vocabulary editor; preview-only menu not in production. This milestone does **not** certify the other games as migrated.

**Branch milestone:** `develop` exists in Word Snake and is the template; older `dev/...` feature branches in other repos are not equivalent. Production `main` needs protection and release gates separately in each canonical repo. The development branch is a mutable workspace, **not** the recovery backup.

**Release discipline:** no production edits from this documentation update; source/route/branch verification, isolated test preview, user-approved release candidate, PR with blocking tests, public smoke test and recovery checkpoint are required.

---

# PRESERVED HISTORICAL DOCS ENTRY POINT (2026-10-25)

# Boring Teacher — documentation entry point

**Updated:** 2026-10-25. Start here before modifying a game.

## Current Sentence Games authority

1. **[Sentence Games canonical audit and operating baseline V1.0](BORING_TEACHER_SENTENCE_GAMES_CANONICAL_AUDIT_V1_0_2026-10-25.md)** — current four-game inventory, exact inspected code origins, source divergence, library/API contracts, evidence and open gates.
2. Sentence Games Menu & Sharing Standard **V1.3** (project source attachment) — field and sharing semantics; its three-game inventory is superseded by the current audit.
3. Master Menu **V1.4** (project source attachment) — approved teacher-menu styling and homepage separation; its three-game status is historical.
4. Sentence Games Grammar Library Spec **V0.4** (project source attachment) — V1.7 candidate scope, schema, editorial sequencing and approval boundary.
5. Voice Routing Source of Truth **V1.1** (project source attachment).
6. Development Standards **V4.2** and Canonical Source Registry **V1.2** (project source attachments) — release and route verification gates.

**Source-of-truth rule:** project attachments are the normative standards; this repo document is the latest inspected Sentence Games *implementation and evidence overlay*. If a conflict is found, stop and compare current code, authoritative standards, user acceptance and public route before editing. Do not infer that a GitHub commit means the live page passed.

## Separate game families

Word Games have their own Word Games Menu & Multilingual Sharing Standard V1.1 and Student Sharing Contract V1.1; their vocabulary API is **not** the Sentence Games sentence-set API. Existing repository Word Games records remain:
- [Word Snake V17 release record](BORING_TEACHER_SOURCE_OF_TRUTH_V17_WORD_SNAKE_RELEASE_2026-10-23.md)
- [Word Games menu standard V1.0 historical repository copy](BORING_TEACHER_WORD_GAMES_MENU_AND_MULTILINGUAL_SHARING_STANDARD_V1_0_2026-10-23.md)

## Updating this documentation

On any production or test change, check the audit's source inventory and unresolved risks; record GitHub SHA, Cloudflare origin evidence, live test, acceptance, and rollback. Publish a dated revision to the audit and update this index; do not silently rewrite historical approvals.
