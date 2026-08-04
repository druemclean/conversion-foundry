# Waterworks — session handoff

**Last updated:** 2026-08-03, end of §11.2.
**Branch:** `waterworks-static-hillside` (pushed; `main` untouched).
**State:** 97 tests green, typecheck clean, build 390.69 kB gzipped.

## Read these first

- `docs/superpowers/specs/2026-08-03-waterworks-design.md` — the design spec. §9.1 (rendering) and §10 are resolved; §11 is the build order.
- `docs/superpowers/plans/2026-08-03-waterworks-static-hillside.md` — §11.1's plan.
- `docs/superpowers/plans/2026-08-03-waterworks-flowing-water.md` — §11.2's plan.

## Done

**§11.1 — static hillside.** Hash route (`#/waterworks`) beside the existing Foundry, procedural terrain, carved channels and basins, intake weir, sluice gates, division lip, boundary gate, pool fittings, daylight rig, and a surrounding landscape.

**§11.2 — flowing water.** Running water in all eleven channels, standing water in all four pools, graded ochre → blue-grey with descent.

## Next: §11.3 — gates you throw

From the spec: *"Gates: throw one, watch downstream change and upstream history persist."*

This is the first step where the piece argues rather than just runs. The semantics that matter (§5.1, §2):

- Throwing a gate changes flow **from that moment forward only**.
- Water already downstream is unaffected and unreachable.
- History persists in the silt — layers below the change keep the composition they were laid down with. §5.2.
- Three kinds of gate, and the distinction matters more than any other single idea in the piece: **chosen** (you decided), **forced** (the ground decided), **inherited** (the platform decided silently and nobody was told).
- §5.7: you cannot evaluate a change from the gate where you made it. The only place a gate change is legible is the pool, and forcing that walk is the point.

The two sluice gates already exist as geometry at `src/waterworks/scene/Structures.tsx`, driven by `DENTIST_SLUICE_GATES` in `src/waterworks/content/layout.ts`. They do not move.

## Conventions that have held for 14 tasks — keep them

- **`src/waterworks/terrain/` and `src/waterworks/content/` import no Three.js and no React.** That boundary is why the maths is unit-testable in Node. Geometry builders return typed arrays; the R3F components in `scene/` are thin assemblers.
- **Dependency order is acyclic:** `types → path → noise`; `heightfield → types/path/noise/tokens`; `layout → types/path/heightfield`. No edge from `heightfield` back to `layout`.
- **Anything built imperatively and handed to R3F as a prop or via `<primitive>` must be disposed in a `useEffect` cleanup.** This has bitten five times. `Terrain.tsx`, `Sky.tsx`, `Surround.tsx`, `Channels.tsx` (which also needs `mesh.dispose()` for its `InstancedMesh`) and `ChannelWater.tsx` all show the pattern.
- **Vertex colours are written linear.** Three reads colour attributes as already in the working space. `srgbToLinear` in `heightfield.ts` exists because this caused a real bug.
- **Assertions must be two-sided.** A one-sided lower bound let a 3× too-deep basin pass, and a monotonic-but-invisible colour ramp passed a monotonicity test while conveying nothing. Bound both ends, and where the point is that a human can *see* something, assert the magnitude, not just the direction.
- **pnpm only.** TypeScript strict with `noUnusedLocals`.

## Open, in rough priority order

1. **Retention-stain legibility through the water is unverified** — especially Ads and Meta, where `fillFrac` and `retentionFrac` sit closest. §10.1's four pool-wall marks depend on it. Needs a real look before more is built on the pools.
2. **Channel water is thin and dark at the overlook.** The grade currently reads mostly through the pools. Widen the ribbon or lift channel luminance.
3. **60fps is unmeasured.** Every attempt so far ran in a browser pane with `visibilityState: hidden`, which throttles rAF and makes any figure fiction. Needs a real visible browser.
4. **A faint bright line traces the tile boundary.** Ruled out by test: the height step, boundary normals, and SSAO. What remains is a detail-resolution mismatch — the tile samples micro-relief at 0.4 units that the surround at 5.0 cannot represent. Fix is a finer surround near the tile.
5. **Pool material `roughness: 0.08 / opacity: 0.9`** was an implementer's judgement call, never compared against alternatives.
6. **CLAUDE.md tension.** The project mandates an "ACES + bloom + SSAO" pipeline; the Waterworks keeps it but runs bloom inert (`luminanceThreshold` 1.05), because §7 forbids emissives. Worth writing in as an explicit per-view exception rather than leaving as inference.

## Remaining build order after §11.3

4. Dye tracing, all three failure modes — §5.6 calls it the highest-value interaction in the piece.
5. `ClientSite` driving the terrain; second and third scenarios.
6. Modes A and B; the pool fit-out.
7. Leaks, side channels, retention lines, silt.
8. Shared-content refactor and the route switch. *(The route switch was pulled forward into §11.1; the content refactor — moving `src/data/stations.ts` into `content/` — was not, and still needs doing.)*
