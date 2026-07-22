# quantum-game — chronicle

*Covers the repo's entire history to date: 2026-07-21. One brief closed (#0002, four
phases), one bootstrap (#0001), one follow-up cleanup.*

## Era 1 — a single file, fully alive

The project began as `quantum-life.html` — one file, 424 lines, everything in it: markup,
dark-mode styling, a Schrödinger-style field simulation, canvas rendering, ring-coherence
scoring, and DOM wiring, all inside one inline `<script>` tag. It worked. Load the page and
a 104×104 complex-valued field evolves under a discretized free-particle Hamiltonian,
rendered as hue-for-phase, brightness-for-amplitude — and a person could reach in: freeze
cells into Zeno-held stillness, pour in amplitude, rotate phase, or collapse a region with
one destructive click, watching coherence die where they'd looked. A physicist's toy
dressed as a game, dense enough that the whole intellectual content of the project was
legible in a single scroll.

That density was also the problem. Nothing was named as a boundary — the seed functions,
the scoring math, the pointer handlers, the render loop, all sat in one closure. There was
nowhere to put a test that wouldn't also require standing up the DOM and the animation loop
around it. The file was compact and correct, but it couldn't grow without either staying
exactly this size forever or being cracked open.

## Era 2 — the process arrives before the product does

Before any of that cracking happened, the repository got a nervous system: brief #0001,
the bootstrap of the `claude-process-automation` workflow. A single atomic action, not a
phased effort — `install.sh` laid down `docs/briefs/`, the skill and command set
(`chronicle`, `installer-builder`, `to-do`, `commit-push-pr`, `create-brief`,
`init-briefs`, `next-brief-phase`, `review-pr`, `start-brief`), and a `CLAUDE.md`
codifying how work here gets proposed, reviewed, and merged. Three settled decisions came
with it, worth noting because they're the kind of default that shapes everything after:
skills install per-project rather than globally, so the repo can tune its own process;
`cost-profiling` was deliberately left out of the core install, since it needs a
Docker/OpenTelemetry sidecar most repos won't want by default; and the installer is
idempotent — it never overwrites what's already there. A clean first install, no
complications recorded.

Worth pausing on as a shape, not just a fact: the very first commit in this repository's
history is process, not product. The refactor that follows was the first real exercise of
that process, and it shows.

## Era 3 — the refactor begins

Brief #0002 set out the actual work: turning the single HTML file into a structured,
typed, testable web app — Vite + TypeScript, a module per responsibility (`types`,
`state`, `engine`, `rendering`, `scoring`, `ui`), tests for the scoring and seed logic.
The brief was explicit about what it wasn't: not a rethink of the quantum metaphor, not a
feature expansion, not license to over-abstract a file that was, after all, compact and
correct before anyone touched it. The plan that came out of reading it was a strict
four-phase chain — scaffold, extract core behavior, testability, polish — each phase's
modules feeding the next, no parallel tracks.

**Phase one** moved the file without moving the meaning. `index.html`, `src/main.ts`,
`src/styles.css` came to exist where `quantum-life.html` had been a single mass. The
simulation step, the render loop, the interaction handlers — all present, now typed under
`strict: true`, none of the logic altered.

The phase's fork: it shipped with zero unit tests, and the repository's own working
agreement says tests gate `main`. The resolution — the brief's own phasing was treated as
authoritative. Phase one was a verbatim structural move with nothing new to assert
against; unit testing was explicitly scoped to phase three, once the scoring and seed
functions existed as pure, isolated units worth testing directly. In its place, phase one
was verified at runtime: typecheck and build clean under strict mode, and a full
Playwright pass through every control — vortex-ring seed, Zeno-hold drag, a destructive
collapse click, every seed/pause/release/clear button — confirmed the refactored app
behaved exactly like the file it replaced, with no console errors. The exemption was
scoped deliberately to phase one only; phase three still owed real unit tests before it
could merge.

One small complication was left open at this point: the brief's proposed module list
didn't say where the requestAnimationFrame loop and seed-button click handlers should
live. The provisional answer — fold both into `src/ui.ts` in phase two — was written down
as a low-risk placeholder, to be confirmed once phase two actually landed.

## Era 4 — the module split

Phase two took the system from one entry file back down to genuine separation of
concerns. `main.ts`, which phase one had left as a 289-line container holding the whole
simulation, shrank to five lines — a composition root that builds a field state and hands
it to the application. In its place: `types.ts` for the shared `Mode` and `FieldState`
shapes, `state.ts` for allocation and seeding, `engine.ts` for the Schrödinger-style
update step, `rendering.ts` for the canvas draw loop, and `ui.ts` for interaction, control
wiring, and the animation loop.

The phase's real decision wasn't the file split — the brief had already proposed that
layout — it was how shared, mutable simulation state should cross the new module
boundaries. A scattered set of exported `let` bindings would not have satisfied the
repository's requirement for explicit named interfaces at every boundary. The resolution,
recorded as this phase's fork: a single typed `FieldState` object, owned and exported by
`state.ts`, passed explicitly into every function that needed it, rather than each module
reaching into shared globals. Every module written afterward took that shape as settled.

The RAF-loop placement question from phase one was confirmed here without objection —
folded into `ui.ts`, as planned. Verified behaviorally: a Playwright pass through every
control showed the split produced no change in what the application does, only in how
it's organized.

## Era 5 — becoming testable

Phase three targeted the one thing phases one and two had deliberately deferred:
automated tests. It found something useful already true — phase two's seed functions in
`state.ts` had no DOM dependencies at all, and were already directly testable without any
further change. The actual work was extracting the scoring math (ring coherence,
held-state percentage) out of `ui.ts`, where it had lived tangled with DOM writes, into a
pure `computeScore(state): ScoreResult` in a new `scoring.ts`. `ui.ts`'s own `score()`
function shrank to a thin wrapper: call the pure function, write the two numbers to the
page.

This phase settled where a module-local return type should live: `ScoreResult`, like
`Renderer` before it in `rendering.ts`, was defined inside `scoring.ts` itself rather than
the shared `types.ts` — a distinction between contracts that cross module boundaries
(`FieldState`) and contracts that are simply a function's own output shape.

Eight unit tests landed with this phase — for `clear` and the three seed functions, and
for `computeScore` at its two extremes: an empty field scoring near zero, a clean
winding-1 vortex ring scoring above ninety percent. Review of the change surfaced two
open, non-blocking gaps rather than defects: nothing yet tested the middle of the
coherence range — signal present but phase-incoherent — and the simulation core,
`engine.ts`, had no tests despite being pure, DOM-free logic. Both were carried forward
rather than resolved on the spot.

## Era 6 — closing the gaps

Phase four, the brief's last, was framed explicitly around finishing what the prior phase
had left open, not just the polish its title implied. It added `engine.test.ts` — unit
tests for the discrete Laplacian and for the update step's treatment of frozen,
Zeno-held cells — and extended `scoring.test.ts` with a mid-range case: a ring seeded
with a winding direction that flips at the vertical axis, present in amplitude but
incoherent in phase, scoring measurably below a clean ring and above an empty field. Both
gaps carried from phase three closed for good.

The phase also filled in the project's own documentation, which had sat as a template
since the very first bootstrap commit: the stack, the build and test commands, and a
description of the module layout, including the rule for where a shared type belongs
versus a module-local one. A readability pass across all six modules found nothing worth
changing — sizes were already proportionate to responsibility. A final Playwright run
confirmed the application still behaved exactly as it had from the very first phase.

With phase four's merge, brief #0002 closed. The single-file prototype had become a typed,
tested, documented small application, four phases and four pull requests after it began.

## Era 7 — a small cleanup, after the brief's close

With the brief finished, one loose thread remained: the three test files sat directly
inside `src/`, alongside the modules they tested. They were moved into `src/tests/`,
relative imports adjusted accordingly, and the project's documentation updated to match.
No governing brief covered this — the change was small enough, and mechanical enough, not
to need one — but it went through the same review gate as every other change before
reaching `main`.

## Roads not taken

None. `docs/briefs/_drafts/` remains empty — nothing has been proposed and parked. The
project is young enough that everything raised so far has been built rather than
deferred.

## Where things stand now

Brief #0002 is closed. The application now lives as seven small modules under `src/` —
`types`, `state`, `engine`, `rendering`, `scoring`, `ui`, and the `main` composition root
— with its tests in `src/tests/`, twelve of them passing, and its structure documented in
the project's own `CLAUDE.md`. What the codebase looks like today is best read from those
files directly — this chronicle is the record of how it got there, not a description of
what's there now, and it will have moved on by the time anyone reads this.

---

## Appendix — cost of the work

*Costs are estimates suitable for relative attribution across commands and skills, not a
substitute for the Claude Console's authoritative dollar figures.*

An initial profile, taken after phase one alone, put that opening cycle at $2.49 across 4
prompts and 79 requests. The figures below supersede it: a final profile of the full
session that carried the project from bootstrap through brief #0002's close and the
test-folder cleanup.

Session `quantum-game-session1`, window 2026-07-21T21:50:14Z → 23:45:58Z (~2 hours), 16
prompts, 297 API requests, **$19.05 total estimated cost**. Tokens: 25,124 in · 138,735
out · 50,945,110 cache-read · 430,326 cache-create.

**Where it concentrated.** Three categories accounted for the overwhelming majority of
spend, and each did real, proportionate work. Unwrapped main-loop construction — writing
modules, running builds and tests, driving the browser through Playwright, managing git
and pull requests — came to 49.3% ($9.40). The brief's own re-planning ceremony
(`next-brief-phase`), invoked between each phase to re-read the ledger and confirm or
revise the remaining sequence, came to 22.6% ($4.31). The correctness-review gate run
before every commit (`review-pr`) came to 19.3% ($3.68). `chronicle`, `start-brief`,
`verify`, and `commit-push-pr` itself each stayed under 3%.

**One finding worth naming.** The re-planning ceremony cost more than the review gate,
despite running fewer times (three invocations against five). For a brief this size —
four small phases — the overhead of re-reading the ledger and re-confirming the plan at
each step was proportionally large next to the size of the code actually changing each
time. Not wasted spend — it's the discipline that kept each phase honestly scoped — but a
real cost of the process, not a free one.

**main vs. subagent.** No subagents were used across the entire session — 100% of cost
sits under `main`. Everything ran single-threaded across roughly two hours and sixteen
prompts. Reasonable at this project's scale.

**Cache health.** Excellent throughout: cache-read (50.9M tokens) outnumbered fresh input
(25K) by roughly two thousand to one, with no sign of the conversation's length forcing
repeated full-context reloads even as it grew across sixteen prompts.

<!-- chronicle:closed-through:2026-07-21 -->
