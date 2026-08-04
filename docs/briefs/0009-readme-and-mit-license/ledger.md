# Ledger — #0009 Root README and MIT license

**Status:** in-progress
**Date:** 2026-08-04

## Phase sequence — single phase (strict chain of one)

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — LICENSE, README, package.json license` | new `LICENSE` (MIT, copyright Josha Stella 2026), new `README.md` (Observers-led landing page + sandbox note for brief/ledger/chronicle), `package.json` (`"license": "MIT"`), `docs/images/observers.png` (user-captured gameplay screenshot) | Repo has a runnable README and an unambiguous MIT grant; npm metadata matches | — | in-progress |

Single phase — LICENSE and README land together because the README's License section links `LICENSE`, and splitting them would leave a half-complete GitHub landing page. Nothing parallel.

## Open decisions — resolved

- **Copyright holder string** → **Josha Stella**, year **2026**. Brief assumed "Josh Stella"; git author on this repo is `Josha Stella <josh.stella@gmail.com>`. No email on the copyright line — name only, standard MIT form.
- **Screenshot in the same PR?** → **Yes.** User-captured gameplay frame at `docs/images/observers.png` (replaced the auto-captured seed shot).
- **Mention the process sandbox?** → **Yes** (user request during execution). README states this repo is also a sandbox for showing the brief / ledger / chronicle skills, pointing at `docs/briefs/` and `/chronicle`, without turning the README into process docs.

## Complications found

- None material. Root had no `README.md` / `LICENSE`; `package.json` had no `"license"` field. No `engines` field — README says recent Node + npm rather than inventing an LTS floor.
- Secondary Claude `MEMORY.md` / `brief-*.md` pointer not written: this Cursor workspace has no project memory directory for that convention. Repo ledger is the source of truth.

## Branches

- `feature/readme-and-mit-license` — phase 1 (active)
