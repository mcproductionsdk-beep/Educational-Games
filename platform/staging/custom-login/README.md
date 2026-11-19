# Combined login candidate — 2026-11-19

Isolated source only. Nothing in the accepted website imports these files. Do not switch Sign in until server wiring, credential and real-provider checks pass.

window.mjs and window.css implement a native modal with both credentials, scoped pixel heading/button styling, beige inputs, transparent dim backdrop, password clearing, same-origin requests, and existing-login/recovery fallback. Font asset is the previously bundled OFL Press Start 2P font; it must be copied into build output when integrated. CSS selectors affect only the modal. Existing page design remains unchanged.

Server candidate: BoringEducation-Accounts feature/custom-login-20261119, custom-login-http.mjs and zitadel-login-client.mjs. Twelve synthetic security tests pass. Neither file is imported by the deployed Worker. Real provider login, policies/MFA and verification behavior, flow-cookie/auth-request binding, atomic distributed attempt limiter, HTTP gateway routing, timeout/replay acceptance and browser UI checks remain open. Do not call this a working login deployment.

Provider prerequisite completed: staging service account be-staging-login-client / 400261730892030687, only IAM_LOGIN_CLIENT granted. No personal access token or key generated. Current custom app login URI remains unchanged. Administrator console and existing hosted login remain usable.

Billing gate: owner completed private Google sign-in. Live Customer Portal https://zitadel.com/admin/billing shows BoringTeacher team on FREE plan with 100 Daily Active Users, and offers Add Payment Method. Dashboard shows 14 activity units for displayed range; remaining API-request quota was not numerically exposed. Usage charts were inspected. No payment method, subscription, customer detail or upgrade was changed. Service-user/API activity consumes free allowances; never upgrade or add paid hosting automatically.

Next required private setup: generate a short-lived credential for the dedicated staging login client and store it as a server-side Cloudflare secret. Never paste in chat, source, browser storage or logs. Credential generation and entry must be completed privately by the owner. This dependency must not be replaced by reusing the event-reader or administrator credentials.

Source baselines: accepted website 5d342d7a783d6c5310fe9b730bea2592d3c0ab6d; accounts accepted 48177a47fc125f0f7143cbd81d4f7637ae45a3b7. Recovery is to retain those deployed versions and discard this unused candidate branch. No production changes, new hosting subscription, database migration or student link changes.
