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

## Era 8 — two siblings, filed together, finished at very different speeds

With the refactor closed, two small briefs were filed in the same commit: #0003 (Observe
mode gets selectable brush shapes — circle, horizontal line, vertical line, a hollow
square outline) and #0004 (enlarge the main canvas display). They shipped on very
different timelines.

#0004 was mechanical and small enough to need only one phase: bump `CELL` from 5 to 7,
matching the canvas's HTML attributes and CSS size to the new 728px total, with `N` and
the underlying simulation grid left untouched. Its one open decision — the target size —
was settled before phase 1 even started. It shipped the same evening it was filed.

#0003 took longer and produced two real forks. The brief itself proposed the shape
picker be hidden entirely outside Observe mode; during `/next-brief-phase` planning this
was reversed in favor of always visible but disabled (greyed out) when a different mode
was active — more discoverable, at the cost of one disabled control group three-quarters
of the time, with "(Observe)" added to the group's label to explain the disabled state
without building tooltip infrastructure. The second fork surfaced in review: phase 1's
diff already contained the branching logic that keeps Source and Phase tune forced to a
circular brush regardless of which shape was selected, but only the shape *masks*
themselves were unit tested, not that mode-based selection. Rather than deferring the gap
to phase 2's manual verification, `apply()` was exported from `ui.ts` and three tests
were added exercising the selection logic directly. Both phases shipped by the following
afternoon.

## Era 9 — a demo that has to prove it isn't cheating

Brief #0005 asked for a "Show me how" button: an autoplaying walkthrough — seed a vortex
ring, freeze it into coherence via Observe/Zeno, then one destructive Collapse — with
captions explaining what's happening and why. Its own stated biggest risk was also its
core design constraint: the demo had to drive the *same* `apply()`/`collapseAt()` code
paths a real player's drag or click would, never a separate simulated result, or it would
silently drift out of sync with real gameplay over time.

That constraint produced this brief's first fork before phase 1 even merged. The brief's
proposed design had `demo.ts` import `apply()`/`collapseAt()` directly from `ui.ts` — but
`ui.ts`'s own runner would need to import `demo.ts` back to drive the button, a circular
import the brief hadn't anticipated. Phase 1's review caught it: `demo.ts` instead
defines a `DemoActions` interface and each phase's `tick()` takes it as a parameter,
letting `ui.ts` pass its own local functions straight through with no import running the
other way.

Phase 2 is where the demo stopped being a straightforward wiring exercise. Live testing —
not planning — surfaced that single-tick phases advanced and finished in the same
instant, too fast to read; that even once paced out, there was no beat between "ring
fully frozen" and "collapsed," so the destructive step landed as a surprise rather than
an explained consequence; and that the collapse itself, at a real player's default brush
size, barely dented the ring's aggregate coherence score, directly contradicting the
demo's own caption promising the player should "watch the score fall." Each of these
became a real decision, not a bug fix: a minimum per-phase dwell was added so no phase
could resolve faster than a player could read it; the demo's fully-autoplaying framing
was deliberately broken with one blocking confirmation popup before Collapse — a
genuine, acknowledged deviation from the brief's own language, arrived at by testing the
built thing against a real reaction rather than reasoning about it abstractly; and the
collapse's brush was temporarily widened for the duration of that one tick only, its
exact value settled by simulating the actual before/after coherence numbers at several
candidate widths rather than picking one and hoping. Phase 3's Playwright pass, run
directly against the built demo, confirmed the popup, both cancel paths, and the tuned
collapse together, then closed with a readability pass and documentation.

## Era 10 — the stage grows, and grows up, twice

Brief #0007 asked the canvas to stop being a fixed 728px square and instead match
whatever height the side panel actually rendered at — and, since a taller display would
visibly pixelate the existing 104-cell grid, to double the simulation resolution
alongside it. Four open decisions were resolved before phase 1 branched, and one of them
was resolved by measurement rather than argument: doubling the grid was benchmarked
directly against `engine.ts`'s actual update step before it was trusted, not assumed safe
because it sounded reasonable.

Reading the code surfaced an architectural constraint the brief hadn't named:
`FieldState.CELL` is `readonly`, settable only once, at construction — which meant the
panel's height had to be measured *before* the field state was built, not after,
reordering what had looked like a simple two-line composition root into a
measure-then-construct sequence. A second, smaller thing was caught in the same review
that produced it: `getBoundingClientRect()` returns a float, but a canvas's width/height
attributes silently truncate to an integer on assignment, so deriving `CELL` from the
raw float while the canvas itself rounded would have left the two based on very slightly
different numbers. Phase 1 closed that gap by rounding once, explicitly, before either
use.

Between #0007's two phases, a smaller and unrelated brief, #0006, ran its own arc. It
asked for on-screen feedback — a flash — when the ring-coherence score crossed a
meaningful threshold during real gameplay, not just the demo. The plan called for a
two-argument pure function, `detectCrossing(prev, curr)`; phase 1 shipped something
else. Its own filing had already named the risk — a fresh reading has no prior value to
compare against, and comparing against an assumed zero would fire a false alarm on every
page load — and a stateful tracker was chosen specifically because it makes that mistake
structurally impossible rather than trusting every future caller to remember it: the
first call always seeds a baseline and returns nothing, by construction, not by
convention. Phase 2's live verification turned up the same finding brief #0005 had
already hit from a different angle: a single collapse click at a real player's default
brush barely moves the aggregate coherence metric, so triggering a "down" flash in
practice needs a wider brush or several clicks — not a bug in the feature, a property of
how the underlying score responds to a small local disturbance, now documented in two
places instead of one.

#0007 had been marked complete for less than a day when it reopened. Its own ledger had
explicitly logged an out-of-scope call: `seedInterf` and `seedPacket`, the game's other
two seed patterns, kept their old hardcoded offsets and falloffs while the grid around
them doubled. Asked directly whether that call still held, the answer wasn't argued, it
was rendered: a screenshot of "Two sources" showed two small dots sitting well inside the
target ring's outline, and "Moving packet" showed a dense little cluster of fringes,
both looking cramped rather than proportionate. Phase 3 scaled both patterns' offsets and
falloffs by the same doubling already applied to the vortex ring's own geometry, then
made one further call the simple doubling didn't cover: the packet's momentum constant
is radians of phase per grid cell, not a size, so widening the packet without touching it
would have crammed twice as many visible fringes into the same relative space — it was
halved instead, to hold the fringe count steady. A second before/after screenshot
confirmed the fix before it shipped.

## Roads not taken

None yet. `docs/briefs/_drafts/` remains empty — nothing has been proposed and parked.
Every brief filed so far, across all seven, has been built rather than deferred; the one
recurring exception is narrower than a parked draft — a brief explicitly scoping part of
its own work out (brief #0007's original call to leave `seedInterf`/`seedPacket`
unscaled), which was itself later revisited and closed rather than left standing.

## Where things stand now

All seven filed briefs are closed. The application has grown from the four-phase
refactor's seven modules to include a scripted demo (`demo.ts`), a score-feedback tracker
(`scoreEvents.ts`), a stage that matches its own side panel rather than a fixed size, and
a simulation grid twice the resolution it started at — with the vortex ring, the two
other seed patterns, and the demo's own tuning all re-derived from the same geometry
rather than left to drift independently. What the codebase looks like today is best read
from `CLAUDE.md` and the modules themselves; this chronicle is the record of how it got
there, not a description of what's there now, and it will have moved on by the time
anyone reads this.

---

## Appendix — cost of the work

*Costs are estimates suitable for relative attribution across commands and skills, not a
substitute for the Claude Console's authoritative dollar figures.*

Two earlier profiles preceded this one: $2.49 after phase one alone, then $19.05 after
brief #0002's close and the test-folder cleanup. Each was accurate at the moment it was
taken and stale by the next message — a cost figure describes a conversation up to the
instant it's measured, not a fixed property of the work. The figures below are simply the
latest snapshot, not a truer final answer than the ones before it.

Session `quantum-game-session1`, window 2026-07-21T21:50:14Z → 2026-07-22T00:04:24Z (~2.25
hours), 18 prompts, 347 API requests, **$24.53 total estimated cost**. Tokens: 27,098 in ·
174,968 out · 66,683,843 cache-read · 486,063 cache-create.

**Where it concentrated.** Unwrapped main-loop construction — writing modules, running
builds and tests, driving the browser through Playwright, managing git and pull requests,
diagnosing and fixing the `gather.sh` script — came to 43.2% ($10.76). `review-pr`, run
before every commit, came to 32.8% ($8.16). The brief's own re-planning ceremony
(`next-brief-phase`), invoked between each phase to re-read the ledger and confirm or
revise the remaining sequence, came to 17.3% ($4.31). `verify`, `chronicle`,
`start-brief`, `commit-push-pr` itself, and `cost-profiling` each stayed under 3%.

**One finding worth naming, updated from the prior snapshot.** At $19.05, the brief's
re-planning ceremony had cost more than its review gate. By $24.53 that had reversed:
`review-pr` grew to nearly a third of total spend, driven by the extra reviews this
cleanup-and-documentation cycle needed (the test-folder move, plus this update itself)
that `next-brief-phase` never touched, since it only runs between brief phases and none
were left to run. The lesson isn't "review costs more than planning" in general — it's
that which category dominates shifts with what kind of work is actually happening, and a
single snapshot can mislead about the steady-state ratio.

**main vs. subagent.** No subagents were used across the entire session — 100% of cost
sits under `main`. Everything ran single-threaded across the full 2.25 hours. Reasonable
at this project's scale.

**Cache health.** Excellent throughout: cache-read (66.7M tokens) outnumbered fresh input
(27K) by roughly 2,500 to one, with no sign of the conversation's length forcing repeated
full-context reloads even as it grew across eighteen prompts.

### A third profile, across a much larger cycle

Run `quantum-game-demo` covers the five briefs in Eras 8–10 above, start to finish:
2026-07-24 through 2026-07-25, thirty-three prompts, 597 API requests, **$70.51 total
estimated cost**. Tokens: 32,688 in · 292,344 out · 188,653,704 cache-read · 2,515,291
cache-create.

**Where it concentrated.** Unlike the $24.53 snapshot above, where `review-pr` and
unwrapped main-loop work were within fifteen points of each other, this run's spend
split almost the same way in absolute terms but at greater scale: unnamed main-loop
conversation took 49.1% ($34.59), `review-pr` took 37.9% ($26.75). The review share is
large but not idle — several of its runs did real investigative work in their own right:
a direct benchmark of the doubled simulation grid before trusting it was fast enough, a
simulated walk of `smoothMax`'s startup convergence to rule out a false-alarm flash, and
the before/after screenshots that settled whether the seed-pattern rescaling was
actually needed. Two single turns, each driving many rounds of live browser verification
in place of a scripted, committed test suite, accounted for over a third of the total on
their own — a cost this project has been paying since its very first Playwright pass in
Era 3, made visible in dollars for the first time.

**main vs. subagent.** Still no subagents anywhere — 100% of cost sits under `main`,
consistent with both prior profiles.

**Cache health.** Held steady at a similar order of magnitude: roughly 189 million
cache-read tokens against about 33 thousand fresh input tokens, even as this
conversation ran far longer and touched far more of the codebase than either prior
snapshot.

<!-- chronicle:closed-through:2026-07-25 -->
