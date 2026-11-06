# Central shell / Snake pilot evidence — 2026-11-04

## Implemented in isolated branches

Central source: Educational-Games/feature/central-runtime-config-20261104 (draft PR #3).
Engine source: Vocabulary-Snake/feature/runtime-config-20261103 (draft PR #1).
Pinned engine dependency for central browser tests: 36c8d3c8852cb4f9fae08925078425731779888b, with per-file SHA-256 in tests/engine-reference.json. Test preparation downloads it into a temporary directory; no maintained engine copy is introduced into the central source.

The central shell owns title, four common actions, loading/errors, navigation and pronunciation. Snake opts into hiding common controls only through a validated session INIT. Directional controls, HUD, canvas, score, collision rules, timing and effects remain engine-owned. Direct compatibility entry retains its baseline layout.

Runtime configuration and typed content validate before an iframe URL is assigned. Both ends validate the engine protocol, session and exact origins/windows. The client verifies engine build identity against the frozen registry and deployment policy, rejects stale/wrong messages and removes timed-out/disposed frames. Focusing the child is distinct from leaving the application. TEST VOICE and answer events use one central browser pronunciation service; pronunciation locale comes from the selected snapshot.

## Automated evidence and boundaries

- Central unit tests cover invalid/missing configuration and zero requests; staging URL restrictions; immutable snapshots; locale/direction; malformed content; redirect refusal and 12-second abort; handshake timeout, spoofed/stale messages, focus/background handling; speech voice matching/cancellation/error reporting.
- Engine unit tests cover mechanics parity, start/pause/restart/dispose, malformed input, session commands and opt-in common-control ownership.
- Engine browser checks compare computed styles/geometry with the preserved source at five viewport sizes and four states, plus actual lifecycle commands across two loopback origins.
- Central browser checks mount the actual central shell with the pinned engine across separate loopback origins at 1280×900 and 390×844, including shared controls, 44px action height, same pronunciation path, target locale, mute, resize state and same-set return. Missing configuration creates no frame and no network requests.

Central browser fixtures mock public-set retrieval and browser speech, and fix the engine rendering clock for deterministic test-only answer injection. The injected hook and loopback deployment policy exist only in test responses. They are not shipped engine features. These tests do not establish audible pronunciation, physical touch support, performance, production service denial, storage isolation or a deployed Pages preview.

Successful initial integrated run: https://github.com/mcproductionsdk-beep/Educational-Games/actions/runs/41824077814 (central SHA 50c7ff68d47174341fc2096c0ece38768504c7f4). Later changes must have their own passing workflow before acceptance; that run is not evidence for untested future commits.

## Remaining gates

1. Actual trusted central shell/engine staging deployment mapping and bootstrap; allowed immutable build combination; no production fallback.
2. Real isolated family-level staging sharing service/store, complete create/edit/publish/fresh-link journey and catalog revision/snapshot behavior. No per-game backend or new account/billing work.
3. Clean release artifact allowlist and tested response headers/CSP. Test fixtures, downloaded dependencies, injected launchers and docs must be excluded from published output.
4. Full device matrix and physical-device speech/effects, touch, focus, background/resume, fullscreen fallback and performance evidence. Emulation and speech instrumentation do not replace these.
5. Integration branch readiness/protection, full required release CI, owner acceptance and separate exact-destination production approval. The existing Snake required migration-safety check remains blocked until its final launcher/release tests exist.

Existing production root and /word-snake/ remain unchanged. This increment neither merges into develop/main nor activates /vocabulary-snake/ or modifies Workers/D1/DNS. Existing source registries stay authoritative until deployment evidence supports a revision.
