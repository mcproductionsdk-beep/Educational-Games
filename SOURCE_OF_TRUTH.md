# BORING TEACHER — SOURCE OF TRUTH

**Project:** Educational Games / Language Games  
**Public site:** https://boringteacher.com  
**GitHub owner:** `mcproductionsdk-beep`  
**Primary site repository:** `mcproductionsdk-beep/Educational-Games`  
**Default branch:** `main`  
**Status:** Living document. Update this file whenever architecture, publishing rules, canonical versions, or shared game standards change.

---

## 1. Purpose of this document

This file is the operational source of truth for the Boring Teacher educational-games project.

Before changing, publishing, debugging, or deploying a game, read this document first. Do not rely only on chat history or assumptions.

The most important distinction in the project is:

> **SOURCE UPDATED is not the same as LIVE SITE VERIFIED.**

A change is complete only when the intended public URL on `boringteacher.com` has been checked and confirmed to serve the new behavior.

---

## 2. Current architecture

### Public website
`boringteacher.com` is the student-facing domain. Students should normally be sent to this domain rather than GitHub URLs.

### Main arcade
Repository: `mcproductionsdk-beep/Educational-Games`

The root `index.html` is the arcade homepage.

**The arcade is a launcher only. It must not contain duplicate copies of the games.** Each game remains canonical in its own repository. Student-facing arcade links may use verified `boringteacher.com/<game>/` routes backed by Cloudflare Workers, while GitHub Pages remains the origin deployment.

Verified example:

`https://boringteacher.com/word-invaders/` → Cloudflare Worker → `https://mcproductionsdk-beep.github.io/Word-Invaders/`

### Current hosting/routing state — verified 2026-10-07

- The domain is managed in Cloudflare.
- `boringteacher.com` still uses GitHub Pages as the origin for the arcade homepage.
- Cloudflare Pages is not the current host.
- The four apex GitHub Pages A records for `boringteacher.com` are now **Proxied** through Cloudflare.
- The `www` CNAME remains **DNS-only**.
- A Cloudflare Worker named `boringteacher-game-router` exists and is deployed.
- The first verified Worker route is `boringteacher.com/word-invaders/*`.
- That route fetches the canonical Word Invaders GitHub Pages deployment at `https://mcproductionsdk-beep.github.io/Word-Invaders/`.
- `https://boringteacher.com/word-invaders/` has been manually verified to open the game while keeping the Boring Teacher URL.
- The Word Invaders arcade card now points to `/word-invaders/`, and clicking it from the public arcade has been manually verified to work.
- Individual game repositories remain the canonical source of each game. The Worker is a delivery/routing layer, not a duplicate source.
- Other arcade cards still use their direct GitHub Pages URLs until equivalent Boring Teacher routes are deliberately implemented and verified.
- Because the apex domain is now proxied, Cloudflare can participate in routing/caching. Cache behavior must therefore be considered when debugging proxied routes.

This architecture may change as more games are moved behind Boring Teacher routes. Update this section whenever another route becomes canonical.

---

## 3. The canonical publishing rule

Each game has **one canonical source repository**. The `Educational-Games` repository is the arcade/launcher, not a second copy of the games.

Therefore:

1. Make the requested change in the correct individual game repository.
2. Test the game logic before publishing.
3. Commit the updated game to `main`.
4. Confirm that game's GitHub Pages deployment serves the new behavior.
5. Ensure the arcade card points to the intended student-facing URL: a verified `boringteacher.com/<game>/` Worker route when one exists; otherwise the canonical GitHub Pages URL.
6. Verify the link from `boringteacher.com`.
7. Only then tell the user exactly what has been verified.

### Critical publishing rule

> **Never copy game HTML into `Educational-Games` as a publishing method. Every game has one canonical repository and GitHub Pages origin deployment. The Boring Teacher arcade is only a launcher. When a verified Cloudflare Worker route exists, the arcade should use the corresponding `boringteacher.com/<game>/` path; otherwise it should use the direct GitHub Pages URL.**

Do not invent local-looking arcade links. A path such as `/word-invaders/` is valid only when a matching Cloudflare Worker route has been deliberately implemented and verified.

If only the repository has been updated, say exactly that: **the repository is updated; live deployment is not yet verified.**

---

## 4. Known repositories and canonical versions

| Game / component | Repository | Last verified title/version |
|---|---|---|
| Arcade homepage | `Educational-Games` | Educational Games Arcade |
| Matching Columns / Word Match | `Matching-Columns` | Word Match Pixel V1.4 Expanded Setup |
| Word Jumper | `Word-Jumper` | Word Jumper Pixel V5.6 |
| Word Racer | `Word-Racer` | Word Racer Pixel V2.4 |
| Word Frog | `Frog-River` | Word Frog Pixel V2.4 |
| Word Invaders | `Word-Invaders` | Word Invaders Pixel V2.2 |
| Word Snake | `Snake` | Repository exists; verify current entry-file path before editing |
| Conjugation Shooter | `Conjugation-Shooter` | Repository exists; inspect current file before editing |
| Conjugation Adventure | `Conjugation-Adventure` | Repository currently needs verification before treating as deployed |
| Vector Monster | `Vector-Monster` | Repository currently needs verification before treating as deployed |
| Place Value Puzzle | `Place-Value-Puzzle` | Repository currently needs verification before treating as deployed |

Do not infer a version from a filename alone. Inspect the actual repository/file before editing.

---

## 5. Arcade link architecture

The preferred student-facing architecture is now:

**arcade → Boring Teacher game path → Cloudflare Worker → canonical GitHub Pages origin**

This has been implemented and verified for Word Invaders:

- Word Invaders student URL → `https://boringteacher.com/word-invaders/`
- Worker route → `boringteacher.com/word-invaders/*`
- Worker → `boringteacher-game-router`
- Canonical origin → `https://mcproductionsdk-beep.github.io/Word-Invaders/`
- Arcade card href → `/word-invaders/`
- Arcade card update commit → `33857cc3dbb41779bd2327469bd812288062de99`
- Manual verification → direct Boring Teacher route works and clicking the arcade card works.

Routes not yet migrated continue to use direct GitHub Pages links:

- Word Racer → `https://mcproductionsdk-beep.github.io/Word-Racer/`
- Word Jumper → `https://mcproductionsdk-beep.github.io/Word-Jumper/`
- Frog River → `https://mcproductionsdk-beep.github.io/Frog-River/`
- Word Snake → `https://mcproductionsdk-beep.github.io/Snake/`
- Matching Columns → `https://mcproductionsdk-beep.github.io/Matching-Columns/`
- Conjugation Shooter → `https://mcproductionsdk-beep.github.io/Conjugation-Shooter/`
- Conjugation Adventure → `https://mcproductionsdk-beep.github.io/Conjugation-Adventure/`
- Vector Monster → `https://mcproductionsdk-beep.github.io/Vector-Monster/`
- Place Value Puzzle → `https://mcproductionsdk-beep.github.io/Place-Value-Puzzle/`

Do not change another arcade card to a local Boring Teacher path until its Worker routing has been created and verified.

---

## 6. Architecture principle

The system preserves single-source behavior while allowing student-facing Boring Teacher URLs:

**individual game repository → GitHub Pages origin → Cloudflare Worker route → boringteacher.com game path**

The Worker does not store a second copy of the game. It fetches the canonical GitHub Pages deployment. This protects repository integrity while allowing students to stay under the Boring Teacher domain.

The arcade homepage remains separately sourced from `Educational-Games` and served at `boringteacher.com`.

---

## 7. Standard game setup UI

Unless a game has a strong gameplay reason to differ, use this setup pattern:

- **Left:** GAME SETTINGS
- **Right:** PASTE QUIZLET WORDS
- Retro/pixel-art arcade visual language.
- Compact responsive frame suitable for classroom screens and embeds.
- Clear PLAY button.
- Language selector.
- Vocabulary/category selector.
- Voice status/diagnostic.
- TEST VOICE button.
- Editable Quizlet-style vocabulary textarea.

Quizlet import format is normally tab-separated:

`target-language-word<TAB>English meaning`

Example:

`gucken    to watch, to look at`

---

## 8. Vocabulary and language rules

The common target languages are:

- German — `de-DE`
- Spanish — `es-ES`
- Danish — `da-DK`
- English — `en-US`

Useful built-in categories include:

Basics, Family, Food & Drink, School, Home, Hobbies, Daily Routine, Places, Clothes, Weather, Animals, Adjectives, Common Verbs, Numbers & Time.

### Critical preservation rule

**Changing the language must never erase custom vocabulary pasted by the user.**

Changing language should:
- update pronunciation/voice settings;
- refresh category choices as needed;
- preserve pasted custom words;
- use Custom / Paste your own when appropriate.

Only deliberately selecting a built-in vocabulary category should replace the textarea content.

---

## 9. Speech/pronunciation rules

Correct answers should normally trigger:
1. success feedback; and
2. pronunciation of the target-language word.

Voice selection must prefer:
1. exact locale match;
2. same base language.

Do **not** silently fall back to an English voice for Danish, German, Spanish, or another target language.

The UI should indicate whether a suitable voice was found and provide a TEST VOICE control.

Useful test phrases:
- Danish: “Godmorgen”
- German: “Guten Morgen”
- Spanish: “Buenos días”
- English: “Good morning”

Browser/OS voice availability can differ between devices.

---

## 10. Shared gameplay principles

These are defaults, not excuses to erase a game's unique mechanics.

- Learning comes before difficulty.
- Correct answers should feel immediately rewarding.
- Wrong answers should give clear visual feedback.
- Missed vocabulary should receive additional practice where appropriate.
- Difficulty should normally increase after completing a full vocabulary round.
- Pause must be visible/accessible.
- Provide a route back to the main menu.
- Provide restart where appropriate.
- Provide sound control where appropriate.
- Avoid layout shifts during play.
- Browser default actions for gameplay keys must be prevented when they interfere with the game/iframe.
- Long vocabulary items must remain playable and readable.
- A game should not become impossible merely because a word is long.

Current standard game-over copy where used:

**“Nice try, your grandma would be proud”**

---

## 11. Game-specific rules

### Matching Columns
- English words are numbered.
- Student types the matching number beside each target-language word.
- **Enter confirms the answer.**
- Never validate on the first digit of a potentially two-digit answer.
- Correct answer triggers pronunciation.
- Wrong answer costs a life/produces clear feedback according to current game design.

### Word Jumper
- Auto-running side-scroller.
- Wrong words function as obstacles.
- Correct words are targets.
- Up jumps; holding allows a higher jump.
- Down crouches.
- Prompt appears above the board and near/moving with the player.
- Hard gameplay rule: **maximum three wrong obstacles before a correct target.**
- Current canonical version: V5.6.

### Word Racer
- Player car moves left/right.
- Every traffic car carries a word.
- Correct answer can be obtained by the intended collision/shooting mechanic.
- Wrong answer loses a life.
- Other cars remain naturally; do not reset the entire board after every correct answer.
- **Space = shoot.**
- **Up/W = accelerate the pace**, not shoot.
- Acceleration must not move/jump the webpage or game frame.
- Do not display a BOOST label that changes layout.
- Current canonical version: V2.4.

### Word Frog
- Frog crosses the river to the opposite bank and returns.
- No lateral movement.
- On the return trip, Down is used for the return jump mechanic.
- Prompt appears close to the frog.
- Reaching the bank must not cause the frog to fall from a platform because of collision/edge logic.
- Current canonical version: V2.4.

### Word Invaders
- Exactly four answer options descend at a time.
- Shooting the correct answer advances to four new options.
- Shooting a wrong answer costs a life.
- A wrong shot must **not** remove/reset all four answer options.
- Current canonical gameplay: V2.4 (enemy shooting + progressive round speed). Note: the HTML title may still say V2.3; identify the build by its actual mechanics/code, not title alone.

### Word Snake
- Arcade snake presentation.
- Screen wrapping.
- Snake grows after a correct answer.
- Wrong answer loses a life but play continues when lives remain.
- Speed increases after a full vocabulary round.
- Prompt appears above the board and on/near the snake.
- Correct catch replaces only that word; do not reset every object on the board.
- Verify current repository entry file/version before the next publish.

---

## 12. Editing discipline

When the user provides an exact HTML file and says it is the final/current version:

**use that exact file as the base.**

Do not rebuild from memory when the source file is available.

Before changing code:
- identify the correct repository;
- identify the correct current file;
- inspect the current version/title;
- preserve unrelated working behavior;
- make the smallest reliable change necessary.

For bug fixes, audit the surrounding logic so the patch does not introduce a new interaction bug.

---

## 13. GitHub publishing procedure

For an existing `index.html`:

1. Fetch the current file and SHA.
2. Compare/inspect the intended source.
3. Update `index.html` on `main` using the current SHA.
4. Record the resulting commit SHA.
5. If the public arcade uses a duplicate/path inside `Educational-Games`, update that copy too.
6. Verify the public route.

For a new repository/file:
1. Confirm repository name and intended public route.
2. Create/publish the correct entry file.
3. Confirm GitHub Pages configuration.
4. Add/update the arcade homepage card.
5. Verify the boringteacher.com route.

Never create a new similarly named repository merely because the expected repository was not immediately found. Search first.

---

## 14. Deployment debugging order

When the source repository looks correct but the website looks old, diagnose in this order:

1. **Source:** Is the requested behavior actually in the canonical file?
2. **Canonical Pages URL:** Does the individual game's GitHub Pages URL serve the requested behavior?
3. **Commit:** Did the write reach `main`?
4. **Pages configuration:** Is GitHub Pages deploying from the expected branch/folder or workflow?
5. **Deployment:** Did the Pages deployment finish successfully?
6. **Worker route:** If the game has a Boring Teacher route, does that route fetch the correct canonical GitHub Pages origin?
7. **Arcade link:** Does the homepage card point to the intended Boring Teacher route (if verified) or direct canonical GitHub Pages URL?
8. **Browser cache:** Hard-refresh only after the server/deployment is known to be correct.
9. **Cloudflare cache:** Because the apex is now proxied, inspect/purge cache only when there is evidence that Cloudflare caching is causing stale content.

Do not use cache purging as a substitute for verifying the deployment architecture.

---

## 15. Definition of Done

A code change is **not done** when code is merely written.

A publishing task is done only when all applicable boxes are true:

- [ ] Correct source/version identified
- [ ] Requested behavior implemented
- [ ] Existing behavior regression-checked
- [ ] Individual game repository updated
- [ ] Arcade card points to the verified Boring Teacher route when available, otherwise the canonical GitHub Pages URL
- [ ] Commit confirmed
- [ ] GitHub Pages/deployment state confirmed
- [ ] Actual `boringteacher.com` route opened/verified
- [ ] User told exactly what is verified
- [ ] This Source of Truth updated if architecture/standards changed

If the final public verification cannot be performed because of a permission/tool limitation, explicitly say which checkbox remains unresolved.

---

## 16. Current infrastructure status

The duplicate-copy approach remains retired.

The target architecture is now:

**one game repository → one GitHub Pages origin → Cloudflare Worker delivery → one Boring Teacher student URL**

Current verified migration status:

- Apex `boringteacher.com`: Cloudflare Proxied.
- `www`: DNS-only.
- Worker: `boringteacher-game-router`.
- Word Invaders route: `boringteacher.com/word-invaders/*` → Worker → canonical Word Invaders GitHub Pages origin.
- Word Invaders direct Boring Teacher URL: verified.
- Word Invaders arcade click: verified.
- Other games: not yet migrated to Worker routes; continue using direct GitHub Pages links.

If a proxied game appears stale, test in this order: canonical GitHub Pages origin, Boring Teacher Worker route, arcade card href, then browser/Cloudflare cache. Do not duplicate game HTML into the arcade repository to solve routing problems.

---

## 17. Guiding principle

The public site is the product.

Repositories, commits, prototypes, and local files are intermediate states. For a student-facing change, the final truth is the behavior visible at the intended `boringteacher.com` URL.
