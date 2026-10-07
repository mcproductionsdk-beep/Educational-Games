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

The root `index.html` is the arcade homepage. Game cards use public paths such as:

`/matching-columns/`

### Current hosting/routing state

At the time this document was created:

- The domain is managed in Cloudflare DNS.
- The site itself is served from GitHub Pages.
- Cloudflare Pages is not the current host.
- No Cloudflare Worker routing was confirmed as active.
- The Cloudflare connection available to ChatGPT could inspect configuration but did not have permission to create the proposed Worker/change the routing.
- Therefore do **not** assume that changing an individual game repository automatically changes `boringteacher.com`.

This architecture may change later. If it does, update this section immediately.

---

## 3. The canonical publishing rule

Many games have an individual development repository. The public arcade may also require a deployed copy/path inside `Educational-Games`.

Therefore:

1. Make the requested change to the correct game source.
2. Test the game logic before publishing.
3. Update the game's individual repository when that repository is part of the game's workflow.
4. Update the corresponding public copy/path used by `Educational-Games` when the site is serving that copy.
5. Confirm the commit succeeded.
6. Confirm the GitHub Pages deployment/source configuration when relevant.
7. Open the **actual boringteacher.com URL** and verify the requested behavior.
8. Only then tell the user that the change is live.

### Never do this

Do not say:
- “It should be live now.”
- “Refreshing should show it.”
- “The website has been updated.”

unless the public URL has actually been verified.

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

## 5. Current public route confirmed in the arcade

### Matching Columns

Homepage route:

`https://boringteacher.com/matching-columns/`

The arcade homepage links to `/matching-columns/`.

A public copy was added at:

`Educational-Games/matching-columns/index.html`

The source was copied from:

`Matching-Columns/index.html`

Important current behavior: answers are validated on **Enter**, not on every input event. This is required so two-digit answers such as 10, 11, and 12 can be typed before validation.

When Matching Columns changes, check both the individual source and the public site copy until/unless the architecture is changed to eliminate duplication.

---

## 6. Desired future architecture

The preferred long-term system is:

**one canonical game source → automatic public delivery at boringteacher.com**

The goal is to remove manual duplicate copies.

A possible architecture is Cloudflare routing/proxying each `boringteacher.com/<game>/` path to the corresponding canonical repository/deployment. This has **not yet been implemented** and must not be described as active.

Until automatic routing/synchronization is genuinely configured and tested, follow the dual-update/public-verification procedure in Section 3.

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
- Current canonical version: V2.2.

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
2. **Public copy:** Is the same change present in the file/path that `Educational-Games` serves?
3. **Commit:** Did the write reach `main`?
4. **Pages configuration:** Is GitHub Pages deploying from the expected branch/folder or workflow?
5. **Deployment:** Did the Pages deployment finish successfully?
6. **Route:** Does the homepage/public URL point to the expected path?
7. **Browser cache:** Hard-refresh only after the server/deployment is known to be correct.
8. **Cloudflare cache:** Purge only if Cloudflare is actually proxying/caching the relevant route.

Do not use cache purging as a substitute for verifying the deployment architecture.

---

## 15. Definition of Done

A code change is **not done** when code is merely written.

A publishing task is done only when all applicable boxes are true:

- [ ] Correct source/version identified
- [ ] Requested behavior implemented
- [ ] Existing behavior regression-checked
- [ ] Individual game repository updated
- [ ] Public `Educational-Games` copy updated if required
- [ ] Commit confirmed
- [ ] GitHub Pages/deployment state confirmed
- [ ] Actual `boringteacher.com` route opened/verified
- [ ] User told exactly what is verified
- [ ] This Source of Truth updated if architecture/standards changed

If the final public verification cannot be performed because of a permission/tool limitation, explicitly say which checkbox remains unresolved.

---

## 16. Current unresolved infrastructure item

The project still needs a true **single-source automatic deployment** system.

Current manual duplication between individual game repositories and public paths can create drift. Until that is eliminated, every publication must explicitly synchronize the public copy and verify the live URL.

GitHub Pages settings/deployment controls were not available through the connected GitHub tool at the time this document was created. If that access becomes available, inspect and document the exact Pages source configuration here.

---

## 17. Guiding principle

The public site is the product.

Repositories, commits, prototypes, and local files are intermediate states. For a student-facing change, the final truth is the behavior visible at the intended `boringteacher.com` URL.
