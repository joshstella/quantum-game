# quantum-game — chronicle

*First chronicle. Covers the repo's entire history to date: 2026-07-21, three commits, two briefs.*

## Era 1 — a single file, fully alive

I began as `quantum-life.html` — one file, 424 lines, everything in it: markup, dark-mode
styling, a Schrödinger-style field simulation, canvas rendering, ring-coherence scoring, and
DOM wiring, all inside one inline `<script>` tag. It worked. Load the page and a 104×104
complex-valued field evolves under a discretized free-particle Hamiltonian, rendered as
hue-for-phase, brightness-for-amplitude — and a person could reach in: freeze cells into
Zeno-held stillness, pour in amplitude, rotate phase, or collapse a region with one
destructive click, watching coherence die where they'd looked. A physicist's toy dressed as
a game, dense enough that the whole intellectual content of the project was legible in a
single scroll.

That density was also the problem. Nothing was named as a boundary — the seed functions, the
scoring math, the pointer handlers, the render loop, all sat in one closure. There was
nowhere to put a test that wouldn't also require standing up the DOM and the animation loop
around it. The file was compact and correct, but it couldn't grow without either staying
exactly this size forever or being cracked open.

## Era 2 — the process arrives before the product does

Before any of that cracking happened, I got a nervous system: brief #0001, the bootstrap of
the `claude-process-automation` workflow. It's a single atomic action, not a phased effort —
`install.sh` laid down `docs/briefs/`, the skill and command set (`chronicle`,
`installer-builder`, `to-do`, `commit-push-pr`, `create-brief`, `init-briefs`,
`next-brief-phase`, `review-pr`, `start-brief`), and a `CLAUDE.md` codifying how work here
gets proposed, reviewed, and merged. Three settled decisions came with it, worth noting
because they're the kind of default that shapes everything after: skills install
per-project rather than globally, so this repo can tune its own process; `cost-profiling`
was deliberately left out of the core install, since it needs a Docker/OpenTelemetry
sidecar most repos won't want by default; and the installer is idempotent — it never
overwrites what's already there. A clean first install, no complications recorded.

This is worth pausing on as a shape, not just a fact: the very first commit in this repo's
history is process, not product. The refactor that follows was the first real exercise of
that process, and it shows.

## Era 3 — the refactor, phase one

Brief #0002 is the actual work: turning the single HTML file into a structured, typed,
testable web app — Vite + TypeScript, a module per responsibility (`types`, `state`,
`engine`, `rendering`, `scoring`, `ui`), tests for the scoring and seed logic. The brief is
explicit about what it isn't: not a rethink of the quantum metaphor, not a feature
expansion, not license to over-abstract a file that was, after all, compact and correct
before anyone touched it.

The plan that came out of reading it was a strict four-phase chain — scaffold, extract core
behavior, testability, polish — each phase's modules feeding the next, no parallel tracks.
Only phase one has executed so far.

**What phase one actually did:** it moved the file, without moving the meaning. `index.html`,
`src/main.ts`, `src/styles.css` now exist where `quantum-life.html` used to be a single
mass. The simulation step, the render loop, the interaction handlers — all present, now
typed under `strict: true`, none of the logic altered. This is the sound of a codebase
proving to itself that it *can* be split before deciding how far to split it.

**The fork:** phase one shipped with zero unit tests, and this repo's own working agreement
says tests gate `main`. That's a real tension, not a rubber stamp — and it's the first
"Big decision" this repo's ledger has recorded. The resolution: the brief's own phasing was
treated as authoritative. Phase one is a verbatim structural move — a typing pass over
existing logic, nothing new to assert against — and unit testing was explicitly scoped to
phase three, once the scoring and seed functions exist as pure, isolated units worth testing
directly. In place of unit tests, phase one was verified at runtime: typecheck and build
clean under strict mode, and a full Playwright pass through every control — vortex-ring
seed, Zeno-hold drag, a destructive collapse click, every seed/pause/release/clear button —
confirmed the refactored app behaves exactly like the file it replaced, with no console
errors. The ledger is careful to scope this: the exemption covers phase one only. Phase
three still owes real unit tests before *it* can merge — the process bent to fit the actual
shape of the work, but it didn't get waived.

**One small complication, still open:** the brief's proposed module list doesn't say where
the requestAnimationFrame loop and seed-button click handlers should live. The provisional
answer — fold both into `src/ui.ts` in phase two, since they're interaction wiring rather
than simulation or rendering — is written down as a low-risk placeholder, adjustable when
phase two actually lands.

## Roads not taken

None yet. `docs/briefs/_drafts/` is empty — nothing has been proposed and parked. The
project is young enough that everything raised so far has been built rather than deferred.

## Where I am now

Phase one of the refactor is merged (PR #1); phases two through four — extracting typed
modules, adding tests, and a final polish pass — are still pending, each waiting on the one
before it. This chronicle describes how I got here, not what I currently look like — for
that, the code and `docs/briefs/0002-quantum-life-structured-refactor/ledger.md` are the
source of truth, and they'll have moved on by the time anyone reads this.

---

## Appendix — cost of this work cycle

*A cost profile of the session that produced this chronicle, run against the local
OpenTelemetry collector. Estimates suitable for relative attribution across commands and
skills — for authoritative dollars, the Claude Console is the source of truth.*

Session `quantum-game-session1`, window 2026-07-21T21:50:14Z → 22:02:52Z (~12.5 minutes),
4 prompts, 79 API requests, **$2.49 total estimated cost**. Tokens: 9,308 in · 30,035 out ·
5,748,269 cache-read · 78,164 cache-create.

**Where it concentrated.** Two roughly even halves: work done directly in the main loop
(65.6%, $1.64 — reading the old file, planning the phase chain, writing six new files,
running installs/builds, and driving a live Playwright verification), and the
`/commit-push-pr` gate (34.4%, $0.86), inside which `review-pr` ($0.64) and `verify`
($0.52) did almost all of it. That split is proportionate to the work: the plain-prompt
half did the actual construction (reading a 424-line file end to end, scaffolding a
project, writing a browser-driven verification script from scratch), and the gate half is
exactly the review-and-verify discipline this repo's process is designed to enforce, not
overhead riding along for free.

**main vs. subagent.** No subagents were used this cycle — 100% of the cost sits under
`main`. Everything ran single-threaded in the primary loop. Reasonable at this scale (one
brief, one small phase); worth reconsidering once phase two's module split is large enough
to parallelize across independent files.

**Cache health.** Cache-read (5.75M tokens) dwarfs fresh input (9.3K) — prompt-cache reuse
was working well throughout; no sign of context churn or repeated full-context reloads.

**One observation.** `review-pr` and `verify` together account for nearly half the
session's total spend (46.8%) despite touching no new logic — because `verify` stood up a
scratch Playwright install and drove a real browser rather than trusting a green typecheck.
That's the cost of the "runtime evidence over passing tests" standard this repo holds
itself to; worth watching whether it stays proportionate as later phases (which will have
real unit tests to lean on) reduce how much runtime verification needs to carry alone.

<!-- chronicle:closed-through:2026-07-21 -->
