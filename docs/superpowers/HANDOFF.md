# Waterworks — session handoff

**Last updated:** 2026-08-04, end of the water legibility pass.
**Branch:** `waterworks-static-hillside` (`main` untouched).
**State:** 128 tests green, typecheck clean, build 391.52 kB gzipped.

## Read these first

- `docs/superpowers/specs/2026-08-03-waterworks-design.md` — the design spec. §9.1 (rendering) and §10 are resolved; §11 is the build order.
- `docs/superpowers/plans/2026-08-03-waterworks-water-legibility.md` — the pass just completed.
- `WATERWORKS_ADDENDUM.md` — **unreconciled.** See "Decisions waiting on Drue" below.
- `.superpowers/sdd/progress.md` — the full task-by-task ledger, including every escalation and what it found.

## Done

**§11.1 — static hillside.** Hash route (`#/waterworks`), procedural terrain, carved channels and basins, intake weir, sluice gates, division lip, boundary gate, pool fittings, daylight rig, surrounding landscape.

**§11.2 — flowing water.** Running water in all eleven channels, standing water in all four pools, graded ochre → blue-grey with descent.

**Water legibility pass (this session).** Both of the previous handoff's top open items turned out to be one defect, and it was worse than recorded.

- **The channel water was not thin. It was underground.** `buildChannelRibbon` placed the surface at `min(bed, bank) - inset` — below the *lower* of the bed and the bank, then lower again. Every vertex of all eleven ribbons sat 0.35–0.49 units under the terrain on average, 0.89 at worst. What reached the screen was the buried ribbon z-fighting through a 0.4-unit tessellation. Water is now placed by **fill level**, each cross-section is level (it was tilted on every cross slope), and the ribbon edge is **measured against the real surface** per cross-section per side rather than derived from the idealised cut profile — the analytic margin was ~0.03 units against terrain micro-relief of ±0.2, which made every edge a coin flip. Filtered exposure is now 100% on ten channels and 97.5% on the eleventh; it was 0%. The ribbon also came out *wider*, since the search widens wherever the bank allows.
- **All four retention stains and all four silt floors were invisible**, not merely faint — submerged by design per §5.4, under pools that at `opacity: 0.9` were effectively opaque. Pools are now at 0.58 and both marks read through the water. §10.1's four marks are all present and differ in kind: a translucent surface, a standing graduated board, a pale line on the wall, a dark deposit on the floor.
- **The colour ramp is now graded against the soil**, not against itself. It ran 0.130 → 0.232 in linear luminance while the bank beside it sits at 0.339, so the clearest water was two-thirds the brightness of its surroundings. Now 0.162 → 0.377, with the clear end above the soil and the muddy end well below it.

**Two content changes** fell out of it: GA4's `retentionFrac` moved 0.12 → 0.3 (at 0.12 its line sat 1.15 units under its own waterline — too deep for any plausible clarity to show, while §10.1 only asks that it be *lowest of the three*, which 0.3 still is), and `retentionStain` moved `#5f5344` → `#cfc4ab`, because the old value sat at the same luminance as the silt beside it and read as shadow.

## The lesson this pass keeps teaching

**Every defect it found had been shielded by a one-sided assertion.** `never stands above the ground beside it` bounds only the upper side, so a 100%-underground ribbon passed clean. Two more were found *during* the pass: the colour ramp had no floor under its muddy end, so a ramp running to black satisfied the entire suite (verified — all five pre-existing colour tests still passed with stop 0 set to `[0.004, 0.004, 0.004]`; only the two new assertions caught it), and the magnitude bound on water depth covered one channel of eleven while the other ten were guarded by direction only.

Bound both ends. Where the point is that a human can see something, assert the magnitude.

## Open, in rough priority order

1. **60fps is still unmeasured.** Every attempt has run in a browser pane reporting `visibilityState: hidden`, which throttles rAF and makes any figure fiction. Needs a real visible browser on your machine.
2. **Meta's retention band is off its wall by ~0.36 for half its circumference** — under *either* the measured radius or the straight-line model it replaced. The ground around that basin is the most irregular of the four, and a circular band at one radius cannot follow a wall whose height varies with bearing. Fixing it properly means a non-circular band, or accepting it. Note the whole-pass review reported this as 0.60 on Meta and 0.40 on Ads; those figures came from probing a single bearing and **do not reproduce** — the real per-basin median errors are GA4 0.180, Ads 0.143, Meta 0.357, final 0.044.
3. **The pool discs are short of their own waterlines** — disc radius against measured radius at the fill level is 3.85/4.91 (GA4), 3.50/4.02 (Ads), 3.70/4.67 (Meta), 5.40/5.72 (final), leaving a dry ring of wall up to 1.06 wide between the water's edge and the bank. Pre-existing, same family of error as item 2 (`radius - rimWidth * 0.5` is a straight-line guess at a smoothstepped wall). Worth fixing with the same measured approach.
4. **The weakest configuration the suite will now pass**, worth knowing before trusting a green run: 35% of a channel's vertices actually checked, 95% of those above ground by any epsilon, with the magnitude bound at `depth * 0.25` cross-channel and `depth * 0.4` on the gated reach alone. Much better than "0% of it checked meaningfully", but not airtight.
5. **`client-gate-run` sits at 97.5% exposure against a 0.95 bound** — 2.5 points of headroom on a deterministic seed, so it will not flake, but any change to the client-gate pad or the meander seed could tip it.
6. **Two small uphill steps survive in the water surface** outside the excluded regions: 0.045 at `rill-centre`'s head (a side effect of the skirt work's noise fade — the rill starts 2 units from a boundary the fade needs 4) and up to 0.039 on `to-meta`, which genuinely climbs the valley's cross-slope faster than it falls down the valley. The water follows the ground it lies in. Documented in the test rather than tuned away.
7. **CLAUDE.md tension.** The project mandates an "ACES + bloom + SSAO" pipeline; the Waterworks keeps it but runs bloom inert (`luminanceThreshold` 1.05) because §7 forbids emissives. Worth writing in as an explicit per-view exception rather than leaving as inference.

Resolved this pass: the old items 1 (retention legibility), 2 (thin channel water) and 5 (pool `roughness`/`opacity`, now a decision with a test behind it rather than an inherited guess). The tile-boundary hairline was fixed separately by the skirt work in `397c0c0`.

## Addendum reconciliation — settled 2026-08-04

All three open questions are closed. Drue decided 1 and 2; 3 followed.

1. **Act II's return path is a signal line, not water.** Written up as **spec §5.8**, which supersedes the addendum's §2.1. A conversion report is a *message about* the water, so it gets its own register: Pixel as a fragile overhead wire strung through gate territory, CAPI as a buried armoured cable that bypasses it, `event_id` as a tag clipped to both. Gravity — and therefore §5.1's whole gate semantics — survives intact, and the Pixel/CAPI distinction lands *in kind* rather than as two shades of magenta, which matters because §7 has already spent colour on the water's clarity grade. The dedup gate's behaviour carries over from the addendum unchanged.
2. **Gates are built on §5.1's taxonomy** — chosen, forced, inherited — with the addendum's named gates hung off the kinds afterwards. Recorded in §5.1 and in the §11 build order. The payoff noted there: the UTM gate is chosen on Meta's route and barely operative on Ads (§1.3's gclid point), so *a gate two channels meet and only one notices* becomes the clearest illustration the taxonomy has — and it only falls out if the kinds are built first.
3. **Audience** is now "anyone" in `CLAUDE.md`, spec §1 and the addendum. No longer in disagreement.

The rest of the addendum needed no adjudication — §1.2's three degradation states fit the existing dye-and-stain vocabulary (§10.4), §1.4 does not fight §9.1's anchored DOM instruments, and §2.2's dedup mechanic was already in §3's station mapping almost word for word. Its Part 1 corrections and its own scope fencing (match-quality and Consent Mode modelling deferred to later sub-toggles) stand as written.

**§11.3 is unblocked.** Act II is sequenced as §11.4b in the build order — lettered, not numbered, because §11.1–§11.3 are referenced by name here and in plan filenames.

## Conventions that have held for 20 tasks — keep them

- **`src/waterworks/terrain/` and `src/waterworks/content/` import no Three.js and no React.** That boundary is why the maths is unit-testable in Node, and it is what let this pass measure its own defects instead of guessing at them. Geometry builders return typed arrays; the R3F components in `scene/` are thin assemblers.
- **Dependency order is acyclic:** `types → path → noise`; `heightfield → types/path/noise/tokens`; `layout → types/path/heightfield`. No edge from `heightfield` back to `layout`.
- **Anything built imperatively and handed to R3F as a prop or via `<primitive>` must be disposed in a `useEffect` cleanup.** This has bitten five times.
- **Vertex colours are written linear.** `srgbToLinear` and `linearFromHex` in `heightfield.ts` exist because this caused a real bug; both are exported so the decode lives in exactly one place.
- **Measure, don't model.** Twice this pass an analytic model of the terrain lost to a search against the actual surface — the ribbon edge, and the basin wall radius. The terrain carries noise the models do not know about. When measuring, **sample more than one bearing**: probing a basin along `+x` alone reads whatever channel happens to cross there, which is how a review came to report a 0.60 error that was really 0.02.
- **Assertions must be two-sided.** See "The lesson this pass keeps teaching".
- **pnpm only.** TypeScript strict with `noUnusedLocals`.

## Remaining build order

3. **Gates you throw** — next, and unblocked. Built on §5.1's three kinds; the addendum's named gates hang off them afterwards.
4. Dye tracing, all three failure modes — §5.6 calls it the highest-value interaction in the piece.
4b. Signal lines and the dedup gate — §5.8.
5. `ClientSite` driving the terrain; second and third scenarios.
6. Modes A and B; the pool fit-out.
7. Leaks, side channels, retention lines, silt.
8. Shared-content refactor. *(The route switch was pulled forward into §11.1; moving `src/data/stations.ts` into `content/` was not, and still needs doing.)*
