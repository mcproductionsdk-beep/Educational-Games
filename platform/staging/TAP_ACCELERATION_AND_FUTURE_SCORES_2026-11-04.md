# Snake tap acceleration and future class scoreboard — 2026-11-04

Owner selected separate taps (not operating-system key repeat), a maximum 1.5× temporary speed, and equivalent on-screen direction-button behavior. Fresh valid directional presses within 450ms build the boost in increments of 0.125; intervals under 40ms do not add speed. The first tap adds no boost. After 300ms without a tap, the boost fades at 0.8 per second. It multiplies the current round movement rate and does not change score values, lives, base round interval or difficulty progression. Pause, restart, disposal and position reset after damage clear boost. Invalid reverse-direction inputs and taps while paused do not add speed. WASD follows the same input path as arrows; swiping remains normal steering. These are explicit owner-requested gameplay changes, not baseline parity claims.

Verification: retain baseline mechanics comparisons without boosting; test cap, fade, rejected directions, pause/restart and unchanged base interval. Browser tests dispatch fresh versus repeated key events and on-screen pointer events to verify both input paths.

## Future class scoreboard boundary

Already implemented: Snake emits score, lives, round, progress and lifecycle status through the origin-checked engine protocol to the central shell. Scoring stays owned by the engine; score transport and teacher UI should be central services, not duplicated in eight game repositories.

Not implemented by this change: collection, persistence, class rooms, identities or teacher dashboard. No score requests are sent to a service.

Future contract should add a class-session identifier distinct from the reusable vocabulary share ID, a per-participant opaque identifier, an attempt identifier reset on restart, immutable set ID, game/build, ordered event sequence, event type, score and progress. Define whether the teacher sees latest attempt, best attempt or both before implementation. A separate teacher-authorized dashboard can subscribe to a shared service while students play independently. Do not treat the existing engine iframe session ID as durable student identity.

Use anonymous aliases by default, teacher-only room visibility, explicit expiry/deletion and separate staging resources. Do not introduce student names or other personal data implicitly. Client-reported scores are suitable for a casual classroom display; trustworthy competitive or graded scores would require additional server-side validation. Snapshot sharing alone does not provide a live class session.

This document records the future integration boundary, not approval to build or deploy the scoreboard. All changes remain staging-only.
