# Combined staging login — 2026-11-19

The combined modal is now integrated on feature/accounts-ui at dfebf82880e30645d708e1c73207d759b7939338. Working staging URL: https://feature-accounts-ui.bt-vocabulary-platform-staging.pages.dev/ . Accounts Worker version 88a88303-d1b9-4303-93c5-13eca4279290 uses the isolated custom-login routes. No production change or payment.

CI: 28 contract tests, existing account controls, combined modal desktop/mobile checks and pinned-engine shell checks passed in job 135424577721. Browser verified both fields and successful flow preparation. The secure credential prompt was cancelled, so actual successful sign-in through this new form remains unverified. Do not call this fully accepted.

Scoped modal CSS preserves the accepted compact header, logo, page colors, menus, game engines and public sharing. Both fields appear together; password is cleared after submission. Existing sign-in/password recovery remains available and handles MFA, unverified email, forced/expired password and other unsupported policy cases. No Create account behavior was added.

Remaining acceptance: real staging sign-in and account display/refresh/logout, wrong password, recovery/reset invalidation and policy fallback. Code-level tests are not substitutes for these live checks. Detailed scope, budgets, provider handling and rollback references are in BoringEducation-Accounts docs/custom-login-staging-20261119.md.

Website rollback baseline: 5d342d7a783d6c5310fe9b730bea2592d3c0ab6d. Keep the new credential encrypted and never copy it into source, logs, browser storage or chat.
