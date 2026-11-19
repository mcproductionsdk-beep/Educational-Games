# Social sign-in staging preparation — 2026-11-19

Requested: Google/Microsoft/Apple account creation/sign-in, without new payments. None is activated by this preparation. No OAuth client, client secret, provider configuration, account linking, registration policy or billing setting was created/changed.

## Verified state and completed UI

Owner directly confirmed combined password sign-in, signed-in refresh, logout and signed-out refresh after Worker 02d54e8b-1fd6-463a-ab13-150cafef979b. This is owner-reported live acceptance, not an agent-observed credential test. Wrong-password and reset-invalidation acceptance for the new entry path remain open.

Website commit 74d1b579ab377509b78992892c7a3b269929c68a adds a dedicated Forgot password? link to the existing secure /auth/start recovery flow and an accessible Show/Hide password button. Recovery currently asks for username before Reset password in the provider UI; no custom reset API or matching reset window was built. The visibility button defaults hidden, resets hidden on submission/close, and does not store/copy the password. Scoped CSS only. Website CI job 135441952590 passed including desktop/mobile tests. Pages deployment 4a84dd8a-be78-4459-9dd9-41afb5562f60 succeeded. Live browser checked input type transitions, pressed state and recovery target. Rollback UI baseline dfebf82880e30645d708e1c73207d759b7939338.

## Google first

Live organization settings showed no existing IdPs. Google template displayed:

- Login V2 authorized callback: https://boringeducation-staging-iig2s7.eu1.zitadel.cloud/idps/callback
- Client type: Web application.
- Proposed display name: Boring Teacher staging.
- Scopes: openid, profile, email only. No mail, Drive, Classroom, contact-list or other API access.
- Provider can automatically create a ZITADEL user on first Google sign-in. Maintain stable internal account IDs through issuer/subject mapping; never merge existing accounts just because emails match. Keep automatic account linking disabled; explicit authenticated linking requires separate design.
- Use a dedicated staging Google OAuth app, exact callback, private client-secret entry in ZITADEL. Do not paste secrets in chat, source, browser storage or logs. No billing account or paid API needed as part of this planned registration; stop on any fee/upgrade requirement. User must handle any new secret creation/entry/submission privately and approve any new terms/security grants at the required point.

Google Cloud Console navigation to https://console.cloud.google.com/apis/credentials returned Site Unavailable / Unable to access this site. One reload produced the same result, issue 2016e4cd-1638-4b7d-a009-7b545135c9f9 reported. No bot-denial inference. Google app setup could not be completed in the agent browser. ZITADEL Google template remained empty and unsaved.

## Microsoft

Requires an app registration in an accessible Entra tenant, client ID and privately created secret. For broad teacher use, proposed supported account type is organizational directories plus personal Microsoft accounts; configure matching Common tenant type. Some schools may require administrator consent. Use the exact ZITADEL V2 callback. Inspect actual account/subscription before any creation; no paid Azure plan, trial billing, new school tenant or licenses authorized. Do not assume school-admin rights or silently mark email verified. App registration not attempted because owner tenant/account details and access have not been established.

## Apple

Official Apple membership documentation includes Sign in with Apple in the Developer Program, normally USD99 per membership year; web setup additionally requires an associated primary App ID, Services ID and key. Do not enroll/pay under current zero-payment instruction. Existing membership or an approved applicable waiver could be considered later; none was verified.

## Server acceptance before activation

Current CredentialBoundEngine and credential-state-guard require a password-change event baseline for every session. New federated-only users will have no such password history. Adding provider buttons/configuration alone would therefore fail callback session creation. Implement an explicit federated-session baseline/lifecycle and evidence, preserving existing password-change invalidation and authoritative internal account mapping. Do not solve this by disabling credential-bound-v1 or treating an empty password event history as a successful password baseline.

Verify provider authentication/claims, new federated account provisioning, returning same account, no email-based account takeover/linking, refresh/logout, provider and local revocation/failure handling, and existing password-session reset behavior. Add public provider buttons only after the whole first-login path passes. Local registration/Create account remains disabled until separately connected; do not show an inert signup button.

Primary references: https://zitadel.com/docs/guides/integrate/identity-providers/google ; https://zitadel.com/docs/guides/integrate/identity-providers/azure-ad-oidc ; https://developer.apple.com/programs/whats-included ; https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/ .
