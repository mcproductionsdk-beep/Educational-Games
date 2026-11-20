# Isolated Mollie test checkout candidate

20 November 2026. Owner authorized the next development step after storing the Test key on the existing staging backend. This branch is based on website `09d5f5f96dd015f584214951b63306f1fd31c13b`; no accepted staging branch is moved by this commit.

Adds a separate `/billing/test` page and its small module. The main editor, catalogue, games, identity controls and existing public link contracts are unchanged. Test offer: simulated EUR 1.00, one hour temporary Premium test access, no automatic renewal. These are synthetic fixture values, not commercial terms.

The gateway permits one exact public POST notification path with credentials/identity headers stripped. Private billing endpoints retain same-origin browser checks and forward session/CSRF to the backend. The build includes `/billing/*` in the Worker routes and copies only the two required page assets. The page stores only a nonsecret retry UUID per tab; failed checkout retries reuse it. A return page or query flag never grants access.

Companion backend: `BoringEducation-Accounts/feature/mollie-test-checkout-20261120`, initial code `67e95ebb8deb88b8dfab99823a2648054a40d6ab`, `docs/MOLLIE_TEST_CHECKOUT_CHECKPOINT_2026-11-20.md`. Read its schema, recovery, activation and production exclusions before deployment. Migration 010 and a valid test profile/account allowlist are prerequisites. A test secret alone does not enable billing.

Gateway checks pass locally (10 tests). Added Chromium desktop/mobile tests cover test-only messaging, preserved retry key, provider navigation, return before payment, verified-status display and disabled accounts/configuration. Local Chromium could not start because socket creation is blocked by the execution environment; CI must establish browser results. Existing full platform/browser CI remains required. Genuine Mollie delivery and real-account browser acceptance have not been performed.

No Worker/Pages deployment, D1 mutation, key read, provider payment, subscription, live charge, production ref or engine change is performed by this commit. Keep the accepted staging site until candidate CI, a disposable D1 rehearsal and the scoped deployment gates pass.
