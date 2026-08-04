# Waterworks Water Legibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Waterworks' water actually visible — running water that sits *in* its channel instead of under it, and pool water clear enough to read the submerged marks through.

**Architecture:** `buildChannelRibbon` currently places the water surface at `min(bed, bank) - inset`, which is below the lowest ground anywhere near it — every ribbon vertex in all eleven channels is underground (measured: mean burial 0.35–0.49 units, max 0.89). It is replaced by a **fill level**: one level `y` per cross-section at `bed + depth * channelFill`, guarded against the rim of its own cut, with the ribbon's half-width derived analytically from the incision profile so its edge always has ground beneath it. The colour ramp is lifted so downstream water outreads the surrounding soil, and pool water drops to a genuinely translucent opacity so the retention stain and silt floor — which are submerged by design, per spec §5.4 — read through the surface.

**Tech Stack:** TypeScript (strict, `noUnusedLocals`), Vitest (node environment), React 18, @react-three/fiber, three r169. pnpm only.

## Global Constraints

- **pnpm only.** No npm, no yarn. Test command is `pnpm vitest run`.
- **`src/waterworks/terrain/` and `src/waterworks/content/` import no Three.js and no React.** That boundary is what keeps the maths unit-testable in Node. Geometry builders return typed arrays; the R3F components in `scene/` are thin assemblers.
- **Dependency order is acyclic:** `types → path → noise`; `heightfield → types/path/noise/tokens`; `layout → types/path/heightfield`. No edge from `heightfield` back to `layout`.
- **Anything built imperatively and handed to R3F as a prop or via `<primitive>` must be disposed in a `useEffect` cleanup.** This has bitten five times.
- **Vertex colours are written linear.** Three reads colour attributes as already in the working space.
- **Assertions must be two-sided.** Bound both ends. Where the point is that a human can *see* something, assert the magnitude, not just the direction. This plan exists because a one-sided assertion let a fully buried water ribbon pass.
- **No placeholder TODOs in committed code.**
- Spec: `docs/superpowers/specs/2026-08-03-waterworks-design.md`. §7 (visual direction), §5.4 (retention line), §10.1 (the four pool-wall marks).

---

### Task 1: The incision-profile solver and the water constants

The channel cross-section is not a rectangle. `channelIncision` (heightfield.ts:60) cuts `depth * smoothstep(halfWidth, 0, d)`, so the cut is full depth at the centreline and feathers to nothing at `halfWidth`. To place a water surface at a given fill and know how wide it is, we need the inverse of that profile. This task adds it, plus the tuning constants the rest of the plan uses.

**Files:**
- Modify: `src/waterworks/terrain/water.ts` (add to the top of the file, above `WATER_STOPS`)
- Test: `src/waterworks/terrain/water.test.ts`

**Interfaces:**
- Consumes: `ChannelCut` from `./types` (already imported by `water.ts`).
- Produces:
  - `export const WATER_SURFACE` — object literal with numeric members `channelFill`, `widthSafety`, `freeboard`, `bedClearance`, `channelOpacity`, `channelRoughness`, `poolOpacity`, `poolRoughness`.
  - `export function incisionRadius(fraction: number): number` — distance from centreline, in units of half-width (0..1), at which the cut has removed `fraction` of its full depth.
  - `export function waterHalfWidth(cut: ChannelCut): number` — the ribbon's half-width in world units.

- [ ] **Step 1: Write the failing test**

Add this block to `src/waterworks/terrain/water.test.ts`. Put it directly after the existing `import` lines, and extend the first import to pull in the new symbols:

```ts
import {
  WATER_STOPS,
  WATER_SURFACE,
  buildChannelRibbon,
  incisionRadius,
  waterColor,
  waterHalfWidth,
} from './water';
```

Then append this `describe` block to the end of the file:

```ts
describe('incisionRadius', () => {
  // The profile carvedGround cuts is depth * smoothstep(halfWidth, 0, d).
  // incisionRadius inverts it: given a fraction of full depth, how far out
  // from the centreline has the cut removed exactly that much?
  const profile = (d: number) => {
    const t = 1 - d;
    return t * t * (3 - 2 * t);
  };

  it('pins the ends of the profile', () => {
    // Full depth at the centreline, nothing at the lip.
    expect(incisionRadius(1)).toBeCloseTo(0, 6);
    expect(incisionRadius(0)).toBeCloseTo(1, 6);
  });

  it('round-trips against the profile it inverts', () => {
    for (const fraction of [0.05, 0.12, 0.15, 0.3, 0.5, 0.75, 0.9]) {
      expect(profile(incisionRadius(fraction))).toBeCloseTo(fraction, 5);
    }
  });

  it('moves outward as less depth is asked for', () => {
    // A shallower slice of the cut is a wider one. If this inverted, every
    // channel's water would be narrowest when the channel was fullest.
    let prev = Infinity;
    for (let f = 0.05; f <= 0.95; f += 0.05) {
      const r = incisionRadius(f);
      expect(r).toBeLessThan(prev);
      prev = r;
    }
  });

  it('clamps outside 0..1 instead of extrapolating', () => {
    expect(incisionRadius(-2)).toBeCloseTo(incisionRadius(0), 6);
    expect(incisionRadius(4)).toBeCloseTo(incisionRadius(1), 6);
  });
});

describe('waterHalfWidth', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;

  it('stays inside the cut it fills', () => {
    expect(waterHalfWidth(cut)).toBeLessThan(cut.halfWidth);
  });

  it('is wide enough to see', () => {
    // Two-sided on purpose. The upper bound above stops it flooding the
    // hillside; without this lower bound a one-pixel thread would pass, and
    // a thread is what the overlook was already showing.
    expect(waterHalfWidth(cut)).toBeGreaterThan(cut.halfWidth * 0.6);
  });

  it('sits inside the true waterline, so its edge has ground beneath it', () => {
    // The waterline is where the cut's own profile meets the fill level. Draw
    // the ribbon any wider than that and its edge is buried in the bank —
    // which is exactly the failure this plan exists to fix.
    const waterline = cut.halfWidth * incisionRadius(1 - WATER_SURFACE.channelFill);
    expect(waterHalfWidth(cut)).toBeLessThan(waterline);
    expect(waterHalfWidth(cut)).toBeGreaterThan(waterline * 0.85);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts`
Expected: FAIL. Vitest reports `No "WATER_SURFACE" export is defined on the "./water" mock` — or, more likely under plain TS, a transform error naming `incisionRadius`, `waterHalfWidth`, and `WATER_SURFACE` as missing exports.

- [ ] **Step 3: Write minimal implementation**

Insert into `src/waterworks/terrain/water.ts`, immediately below the existing `import type { ChannelCut } from './types';` line and above `export type WaterStop`:

```ts
/**
 * Tuning for both water surfaces, kept here rather than in the R3F
 * components so a Node test can assert against them. `terrain/` imports no
 * Three.js — that boundary is why any of this is testable.
 */
export const WATER_SURFACE = {
  /** Fraction of a channel's depth that the running water fills. */
  channelFill: 0.85,
  /**
   * Pulls the ribbon inside the true waterline. The edge then always has
   * ground below it; drawn at the waterline exactly, it would graze the bank
   * and re-bury itself wherever the terrain's micro-noise ran high.
   */
  widthSafety: 0.94,
  /** Water may never come closer than this to the rim of its own cut. */
  freeboard: 0.05,
  /** Water always stands at least this far above its own bed. */
  bedClearance: 0.02,

  channelOpacity: 0.88,
  channelRoughness: 0.2,

  /**
   * Spec §5.4 puts the retention line and the silt below the waterline by
   * definition, and §10.1 needs both readable. At 0.9 the pools were opaque
   * and two of the four pool-wall marks rendered to nothing.
   */
  poolOpacity: 0.58,
  poolRoughness: 0.12,
} as const;

/**
 * Inverse of the cut profile `channelIncision` uses — `smoothstep(halfWidth,
 * 0, d)`, in units of half-width. Returns the distance from the centreline at
 * which the cut has removed `fraction` of its full depth: 0 at the deepest
 * point, 1 at the lip.
 *
 * Bisection rather than the closed form. Smoothstep's cubic inverts to a
 * trigonometric expression that is easy to get subtly wrong, and this runs
 * eleven times at module load — the clarity is worth more than the cycles.
 */
export function incisionRadius(fraction: number): number {
  const target = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const t = 1 - mid;
    const profile = t * t * (3 - 2 * t);
    // The profile falls as `mid` grows, so still-too-deep means go outward.
    if (profile > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Half-width of the water surface in a filled channel, in world units. */
export function waterHalfWidth(cut: ChannelCut): number {
  return cut.halfWidth * incisionRadius(1 - WATER_SURFACE.channelFill) * WATER_SURFACE.widthSafety;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts`
Expected: PASS. The three previously-failing describes are green; the pre-existing `buildChannelRibbon` describe still passes because nothing it calls has changed yet.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/water.ts src/waterworks/terrain/water.test.ts
git commit -m "waterworks: invert the channel incision profile so water can be placed by fill level"
```

---

### Task 2: Put the water in the channel instead of under it

The bug. `buildChannelRibbon` sets each bank vertex to `Math.min(bed, height(x, z)) - inset` — below the *lower* of the bed and the bank, then lower again. Every vertex of every channel is underground. This task replaces `inset` with a fill level, gives each cross-section a single level `y` (a water surface is level across its width; sampling per-bank tilted the ribbon on every cross slope), and replaces the one-sided assertion that let this through.

**Files:**
- Modify: `src/waterworks/terrain/water.ts:54-126` (the `buildChannelRibbon` function)
- Test: `src/waterworks/terrain/water.test.ts` (the existing `buildChannelRibbon` describe block)

**Interfaces:**
- Consumes: `WATER_SURFACE`, `waterHalfWidth` from Task 1.
- Produces: `buildChannelRibbon(cut: ChannelCut, height: (x: number, z: number) => number)` — **the third parameter `inset` is removed.** Return shape is unchanged: `{ positions: Float32Array; uvs: Float32Array; colors: Float32Array; indices: Uint32Array }`.

- [ ] **Step 1: Write the failing test**

In `src/waterworks/terrain/water.test.ts`, replace the whole existing `describe('buildChannelRibbon', ...)` block with this one. Note the changed `buildChannelRibbon` call — two arguments now, not three.

```ts
describe('buildChannelRibbon', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;
  const height = (x: number, z: number) =>
    carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
  const ribbon = buildChannelRibbon(cut, height);

  it('emits two vertices per centreline sample', () => {
    expect(ribbon.positions.length).toBe(cut.pts.length * 2 * 3);
  });

  it('emits two triangles per segment', () => {
    expect(ribbon.indices.length).toBe((cut.pts.length - 1) * 6);
  });

  it('keeps every index in range', () => {
    const maxIndex = ribbon.positions.length / 3 - 1;
    for (const idx of ribbon.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });

  it('sits inside the channel it fills, never wider', () => {
    for (let i = 0; i < ribbon.positions.length; i += 3) {
      const x = ribbon.positions[i];
      const z = ribbon.positions[i + 2];
      let nearest = Infinity;
      for (const p of cut.pts) nearest = Math.min(nearest, Math.hypot(x - p.x, z - p.z));
      expect(nearest).toBeLessThanOrEqual(cut.halfWidth + 1e-6);
    }
  });

  it('runs downhill from first sample to last', () => {
    const firstY = ribbon.positions[1];
    const lastY = ribbon.positions[ribbon.positions.length - 2];
    expect(lastY).toBeLessThan(firstY);
  });

  it('keeps every cross-section level', () => {
    // A water surface is level across its width. Sampling the bank height
    // per side tilted the ribbon on every cross slope.
    for (let i = 0; i < ribbon.positions.length; i += 6) {
      expect(ribbon.positions[i + 4]).toBeCloseTo(ribbon.positions[i + 1], 9);
    }
  });

  it('stands in its cut, neither buried nor overfilled', () => {
    // The regression this plan exists for, bounded from both sides. The old
    // code placed the surface below the lower of bed and bank, so all 62
    // vertices of this channel — and of the other ten — were underground by
    // 0.35 to 0.89 units, and the one-sided assertion that replaced this one
    // passed anyway.
    //
    // Lower bound: a direction-only check would pass on a one-micron film, so
    // the water has to be a real fraction of the cut deep. Upper bound: you
    // cannot fill a channel deeper than you dug it. Both are stated against
    // the cut's own depth rather than against nearby ground — on a cross
    // slope, water at this fill legitimately sits above the hillside a couple
    // of metres downslope, which is what a bank is for.
    for (let i = 0; i < ribbon.positions.length; i += 6) {
      const y = ribbon.positions[i + 1];
      // The centreline lies midway between the two bank vertices.
      const cx = (ribbon.positions[i] + ribbon.positions[i + 3]) / 2;
      const cz = (ribbon.positions[i + 2] + ribbon.positions[i + 5]) / 2;
      const standing = y - height(cx, cz);

      expect(standing).toBeGreaterThan(cut.depth * 0.4);
      expect(standing).toBeLessThanOrEqual(cut.depth + 1e-6);
    }
  });

  it('shows water at the surface in every channel, not just this one', () => {
    // The bug was uniform across all eleven cuts, so the guard has to be too.
    // Channels that end in a pond dip below grade at the mouth, which is
    // correct — hence a high bar rather than a total one.
    for (const c of DENTIST_CHANNELS) {
      const r = buildChannelRibbon(c, height);
      let exposed = 0;
      let total = 0;
      for (let i = 0; i < r.positions.length; i += 3) {
        const g = height(r.positions[i], r.positions[i + 2]);
        if (r.positions[i + 1] > g) exposed++;
        total++;
      }
      expect(exposed / total).toBeGreaterThan(0.85);
    }
  });

  it('carries a flow coordinate that increases downstream', () => {
    let prev = -Infinity;
    for (let i = 1; i < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i]).toBeGreaterThanOrEqual(prev);
      prev = ribbon.uvs[i];
    }
  });

  it('gives both banks of a sample the same flow coordinate', () => {
    for (let i = 1; i + 2 < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i + 2]).toBeCloseTo(ribbon.uvs[i], 9);
    }
  });

  it('separates the two banks across the ribbon', () => {
    expect(ribbon.uvs[0]).toBe(0);
    expect(ribbon.uvs[2]).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts`
Expected: FAIL. `stands above its own bed, by a visible amount` fails first with a negative difference around `-0.4`; `shows water at the surface in every channel` fails with `0` exposed.

- [ ] **Step 3: Write minimal implementation**

Replace `buildChannelRibbon` in `src/waterworks/terrain/water.ts` — the whole function including its docstring — with:

```ts
/**
 * A water surface following a channel centreline.
 *
 * Water is placed by *fill level*, not by offset from the ground: one level
 * `y` per cross-section at `bed + depth * channelFill`, clamped so it can
 * neither top the rim of its own cut nor sink back to the bed.
 *
 * The predecessor offset the surface below `min(bed, bank)`, which put all
 * eleven channels underground — mean burial 0.42 units — and what reached the
 * screen was the buried ribbon z-fighting through a terrain tessellated at
 * 0.4. Both bank vertices now share one `y`, because a water surface is level
 * across its width and per-bank sampling tilted it on every cross slope.
 *
 * Returns typed arrays rather than geometry so this stays testable in Node.
 */
export function buildChannelRibbon(
  cut: ChannelCut,
  height: (x: number, z: number) => number,
): {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
} {
  const n = cut.pts.length;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const halfWidth = waterHalfWidth(cut);
  let run = 0;

  for (let i = 0; i < n; i++) {
    const p = cut.pts[i];
    const prev = cut.pts[Math.max(0, i - 1)];
    const next = cut.pts[Math.min(n - 1, i + 1)];
    if (i > 0) run += Math.hypot(p.x - prev.x, p.z - prev.z);

    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;

    const t = cut.flowFrom + (cut.flowTo - cut.flowFrom) * (n === 1 ? 0 : i / (n - 1));
    const rgb = waterColor(t);
    const bed = height(p.x, p.z);

    // The rim is sampled at the cut's full half-width, where the incision
    // profile has returned to grade. Sampling at the ribbon's edge instead
    // would read ground that is below the water by design and drag the
    // surface straight back down to the bed.
    const rimA = height(p.x + nx * cut.halfWidth, p.z + nz * cut.halfWidth);
    const rimB = height(p.x - nx * cut.halfWidth, p.z - nz * cut.halfWidth);
    const guard = Math.min(rimA, rimB) - WATER_SURFACE.freeboard;
    // The bed clearance wins over the rim guard, which matters at a channel
    // mouth: there the rim samples land inside the pond and sit below the
    // channel bed, and obeying them would bury the last few metres.
    const y = Math.max(
      bed + WATER_SURFACE.bedClearance,
      Math.min(bed + cut.depth * WATER_SURFACE.channelFill, guard),
    );

    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      const x = p.x + nx * sign * halfWidth;
      const z = p.z + nz * sign * halfWidth;

      const v = (i * 2 + side) * 3;
      positions[v] = x;
      positions[v + 1] = y;
      positions[v + 2] = z;
      colors[v] = rgb[0];
      colors[v + 1] = rgb[1];
      colors[v + 2] = rgb[2];

      const u = (i * 2 + side) * 2;
      uvs[u] = side;
      uvs[u + 1] = run;
    }
  }

  let k = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices[k++] = a;
    indices[k++] = c;
    indices[k++] = b;
    indices[k++] = b;
    indices[k++] = c;
    indices[k++] = d;
  }

  return { positions, uvs, colors, indices };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts`
Expected: PASS, all describes green.

Then run the whole suite — `ChannelWater.tsx` still passes a third argument, which is a type error, not a test failure:

Run: `pnpm typecheck`
Expected: FAIL with `TS2554: Expected 2 arguments, but got 3` at `src/waterworks/scene/ChannelWater.tsx:29`. Task 4 fixes it; do not fix it here.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/water.ts src/waterworks/terrain/water.test.ts
git commit -m "waterworks: place channel water by fill level so it stops being underground"
```

---

### Task 3: Lift the colour ramp so descent reads against the ground

The ramp runs 0.130 → 0.232 in linear luminance. The soil it sits in (`WW_PALETTE.soilDry`) is 0.339, so even the clearest downstream water is about two-thirds the brightness of the bank beside it — every channel reads as a dark line regardless of geometry. Spec §7 makes this grade the only chart in the piece, so it has to win against its background, not just against itself.

**Files:**
- Modify: `src/waterworks/terrain/water.ts:17-22` (the `WATER_STOPS` array and its docstring)
- Test: `src/waterworks/terrain/water.test.ts` (the existing `waterColor` describe block)

**Interfaces:**
- Consumes: `srgbToLinear` from `./heightfield`, `WW_PALETTE` from `../tokens` — both already exist; add imports to the test file only.
- Produces: no signature change. `WATER_STOPS` and `waterColor(t)` keep their shapes.

- [ ] **Step 1: Write the failing test**

Add these two imports to the top of `src/waterworks/terrain/water.test.ts`:

```ts
import { WW_PALETTE } from '../tokens';
import { carvedHeight, srgbToLinear } from './heightfield';
```

(The existing file already imports `carvedHeight` from `./heightfield` — merge the two into the single line shown rather than importing twice.)

Then add these tests inside the existing `describe('waterColor', ...)` block:

```ts
  it('outreads the soil it runs through, at the clear end', () => {
    // §7 makes the colour grade the only chart in the piece. A ramp that is
    // monotonic but sits below its background is a chart drawn in a colour
    // you cannot see — which is what 0.130 → 0.232 against soil at 0.339 was.
    const n = parseInt(WW_PALETTE.soilDry.slice(1), 16);
    const soil = luma([
      srgbToLinear(((n >> 16) & 255) / 255),
      srgbToLinear(((n >> 8) & 255) / 255),
      srgbToLinear((n & 255) / 255),
    ]);
    expect(luma(waterColor(1))).toBeGreaterThan(soil);
    // And the muddy end must still read as darker than the bank, or there is
    // no grade left to see.
    expect(luma(waterColor(0))).toBeLessThan(soil * 0.65);
  });

  it('spreads far enough across the ramp to be legible', () => {
    // Two-sided. Too narrow and the network reads as one flat tone; too wide
    // and the rills go to black while the pool blows out.
    const spread = luma(waterColor(1)) - luma(waterColor(0));
    expect(spread).toBeGreaterThan(0.18);
    expect(spread).toBeLessThan(0.4);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts -t 'outreads the soil'`
Expected: FAIL — `expected 0.2319 to be greater than 0.3386`.

- [ ] **Step 3: Write minimal implementation**

Replace the `WATER_STOPS` declaration and its docstring in `src/waterworks/terrain/water.ts` with:

```ts
/**
 * Spec §7: water graded from muddy ochre at the rills, through olive, to
 * blue-grey and finally near-clear at the pool. Linear-space values, because
 * these are written into a vertex-colour attribute and Three reads those as
 * already linear — the same trap that made the terrain render too bright.
 *
 * The luminance spread is doing the actual work, and it is measured against
 * the *soil*, not against itself. A first pass ran 0.107 to 0.144: monotonic,
 * so the test passed, and far too narrow to see. The second ran 0.130 to
 * 0.232, which is a real spread but still sits under the 0.339 of the bank it
 * runs through — so every channel read as a dark line whatever its geometry.
 * The clear end now outreads the soil and the muddy end stays well under it,
 * which is what makes "clearer with descent" legible without a legend.
 */
export const WATER_STOPS: WaterStop[] = [
  { at: 0.0, rgb: [0.235, 0.15, 0.062] },
  { at: 0.38, rgb: [0.255, 0.245, 0.105] },
  { at: 0.72, rgb: [0.23, 0.31, 0.32] },
  { at: 1.0, rgb: [0.3, 0.395, 0.43] },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/waterworks/terrain/water.test.ts`
Expected: PASS. In particular the pre-existing `clears monotonically with descent`, `loses its ochre warmth as it clears` and `is continuous across every stop` must all still pass — the new stops preserve monotonic luminance (0.162 → 0.237 → 0.294 → 0.377) and falling `r - b` (0.173 → −0.130).

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/water.ts src/waterworks/terrain/water.test.ts
git commit -m "waterworks: grade the water against the soil it runs through, not against itself"
```

---

### Task 4: Wire the scene components to the shared constants

`ChannelWater.tsx` still passes the removed `inset` argument (typecheck is red from Task 2), and both water components hardcode material numbers that Task 1 moved into `WATER_SURFACE`.

**Files:**
- Modify: `src/waterworks/scene/ChannelWater.tsx:9-11` (the `INSET` constant), `:29` (the call), `:55` (the material)
- Modify: `src/waterworks/scene/PoolWater.tsx:34` (the material)

**Interfaces:**
- Consumes: `WATER_SURFACE` and the two-argument `buildChannelRibbon` from Tasks 1–2.
- Produces: no new exports.

- [ ] **Step 1: Confirm the failure this task fixes**

Run: `pnpm typecheck`
Expected: FAIL with `TS2554: Expected 2 arguments, but got 3` at `src/waterworks/scene/ChannelWater.tsx:29`.

- [ ] **Step 2: Update ChannelWater**

In `src/waterworks/scene/ChannelWater.tsx`, delete these three lines entirely (the constant and its comment):

```ts
// Lifts the surface off the bed, per buildChannelRibbon's contract — the same
// figure every other scene component that samples the terrain leaves alone.
const INSET = 0.1;
```

Change the import on line 6 to bring in the constants:

```ts
import { WATER_SURFACE, buildChannelRibbon } from '../terrain/water';
```

Change the call on line 29 from `buildChannelRibbon(cut, height, INSET)` to:

```ts
      const ribbon = buildChannelRibbon(cut, height);
```

Change the material on line 55 to:

```ts
  const material = useMemo(
    () =>
      createWaterMaterial({
        roughness: WATER_SURFACE.channelRoughness,
        opacity: WATER_SURFACE.channelOpacity,
      }),
    [],
  );
```

- [ ] **Step 3: Update PoolWater**

In `src/waterworks/scene/PoolWater.tsx`, change the import on line 6 to:

```ts
import { WATER_SURFACE, waterColor } from '../terrain/water';
```

and replace line 34 with:

```ts
      // Spec §5.4 puts the retention line and the silt below the waterline by
      // definition. At the old 0.9 the pools were opaque and both marks
      // rendered to nothing — two of §10.1's four went missing.
      const material = createWaterMaterial({
        roughness: WATER_SURFACE.poolRoughness,
        opacity: WATER_SURFACE.poolOpacity,
      });
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck`
Expected: PASS, no output.

Run: `pnpm vitest run`
Expected: PASS, all test files green.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/scene/ChannelWater.tsx src/waterworks/scene/PoolWater.tsx
git commit -m "waterworks: drive both water surfaces from the shared tuning constants"
```

---

### Task 5: A retention line you can tell from the stone

With translucent pools the stain is now transmitted — but `retentionStain: '#5f5344'` sits at linear luminance 0.108 against `silt: '#6a5940'` at 0.106. They are the same tone. A dark stain on dark stone reads as shadow, which is the failure mode already costing us two marks. §10.1 requires the four marks to differ **in kind**: a surface, a standing post, a line on stone, a deposit on the floor. The line becomes a pale mineral deposit — physically what a tide line on wet stone looks like, and unmistakably not a shadow.

The stain stays **submerged**. Spec §5.4 is right that the retention line is underwater by definition, and this plan does not edit the physics to fix a rendering problem — so the test records the submersion deliberately, to stop a future reader "correcting" it by lifting the band above the waterline.

**Files:**
- Modify: `src/waterworks/tokens.ts:26` (the `retentionStain` entry)
- Modify: `src/waterworks/content/layout.ts` (add `RETENTION_STAIN_HEIGHT` export)
- Modify: `src/waterworks/scene/Pools.tsx:48` (consume the shared constant)
- Create: `src/waterworks/content/marks.test.ts`

**Interfaces:**
- Consumes: `DENTIST_BASINS` from `../content/layout`, `WW_PALETTE` from `../tokens`, `srgbToLinear` from `../terrain/heightfield`, `WATER_SURFACE` from `../terrain/water`.
- Produces: `export const RETENTION_STAIN_HEIGHT: number` from `src/waterworks/content/layout.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/waterworks/content/marks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DENTIST_BASINS, RETENTION_STAIN_HEIGHT } from './layout';
import { WW_PALETTE } from '../tokens';
import { srgbToLinear } from '../terrain/heightfield';
import { WATER_SURFACE } from '../terrain/water';

function linearLuma(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

describe('the four pool-wall marks (spec §10.1)', () => {
  it('keeps every retention line below its waterline', () => {
    // Deliberate, and recorded here so nobody "fixes" the legibility problem
    // by lifting the band into the air. §5.4: the retention line is the
    // lowest point a new intake can be lowered to, which is underwater by
    // definition. Legibility is the water's job, not the line's.
    for (const basin of DENTIST_BASINS) {
      const waterline = basin.depth * basin.fillFrac;
      const stainTop = basin.depth * basin.retentionFrac + RETENTION_STAIN_HEIGHT / 2;
      expect(stainTop).toBeLessThan(waterline);
    }
  });

  it('keeps the retention line reachable through the water', () => {
    // Submerged is fine; invisible is not. If a pool were ever filled so far
    // above its retention line that no plausible clarity would show it, the
    // mark is decorative. Half the basin's depth is the working bound.
    for (const basin of DENTIST_BASINS) {
      const waterline = basin.depth * basin.fillFrac;
      const stainTop = basin.depth * basin.retentionFrac + RETENTION_STAIN_HEIGHT / 2;
      expect(waterline - stainTop).toBeLessThan(basin.depth * 0.5);
    }
  });

  it('makes the retention line a different tone from the stone it marks', () => {
    // §10.1: the four marks survive only by differing in kind. At #5f5344 the
    // stain sat at 0.108 against silt at 0.106 — the same tone, so through
    // clear water it would still have read as nothing.
    const stain = linearLuma(WW_PALETTE.retentionStain);
    for (const wall of [WW_PALETTE.silt, WW_PALETTE.soilDamp, WW_PALETTE.soilDry]) {
      expect(Math.abs(stain - linearLuma(wall))).toBeGreaterThan(0.12);
    }
  });

  it('reads the retention line as a light mark, not a dark one', () => {
    // Direction matters as well as magnitude: a mark darker than its
    // surroundings is indistinguishable from the shadow in the basin.
    expect(linearLuma(WW_PALETTE.retentionStain)).toBeGreaterThan(
      linearLuma(WW_PALETTE.silt),
    );
  });

  it('keeps the pools translucent enough to transmit a submerged mark', () => {
    // The upper bound is what this whole pass turns on. The lower bound stops
    // a later tuning pass dissolving the water surface altogether — the
    // surface is itself one of the four marks.
    expect(WATER_SURFACE.poolOpacity).toBeLessThan(0.7);
    expect(WATER_SURFACE.poolOpacity).toBeGreaterThan(0.35);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/waterworks/content/marks.test.ts`
Expected: FAIL — the import of `RETENTION_STAIN_HEIGHT` from `./layout` is unresolved, so the file fails to collect.

- [ ] **Step 3: Write minimal implementation**

In `src/waterworks/content/layout.ts`, add this export directly above the `DENTIST_BASINS` declaration:

```ts
/**
 * Height of the retention-line band on a basin wall. Lives here rather than
 * in the R3F component so a Node test can check the band against the
 * waterline it sits under — spec §5.4 puts it below the surface by design.
 */
export const RETENTION_STAIN_HEIGHT = 0.22;
```

In `src/waterworks/tokens.ts`, replace the `retentionStain` entry with:

```ts
  /**
   * A pale mineral tide line, not a dark stain. §10.1 needs the four
   * pool-wall marks to differ in kind, and the previous #5f5344 sat at the
   * same luminance as the silt beside it — so it read as shadow, which is
   * the one thing a mark must not do.
   */
  retentionStain: '#cfc4ab',
```

In `src/waterworks/scene/Pools.tsx`, delete the local constant and its comment:

```ts
const STAIN_HEIGHT = 0.22;
```

extend the existing `layout` import to:

```ts
import {
  DENTIST_BASINS,
  DENTIST_CHANNELS,
  DENTIST_PADS,
  RETENTION_STAIN_HEIGHT,
  type BasinSpec,
} from '../content/layout';
```

and replace the two `STAIN_HEIGHT` references inside `RetentionStain` with `RETENTION_STAIN_HEIGHT`:

```ts
  const flare = (basin.rimWidth * (RETENTION_STAIN_HEIGHT / 2)) / basin.depth;

  return (
    <mesh position={[basin.center.x, y, basin.center.z]}>
      <cylinderGeometry
        args={[
          (wallRadius + flare) * 1.006,
          (wallRadius - flare) * 1.006,
          RETENTION_STAIN_HEIGHT,
          64,
          1,
          true,
        ]}
      />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/waterworks/content/marks.test.ts`
Expected: PASS, 5 tests.

Run: `pnpm vitest run && pnpm typecheck`
Expected: PASS. Note the second `marks.test.ts` assertion is expected to hold for all four basins — GA4 clears it at `1.512 - 0.362 = 1.15` against a bound of `2.1 * 0.5 = 1.05`. **If GA4 fails it, that is a real finding, not a bad test:** it means GA4's `retentionFrac` of 0.12 puts its line too deep to ever be seen, and the fix is to raise `retentionFrac` toward 0.3 in `layout.ts` — GA4's line is meant to be *lowest on the wall*, not invisible. Make that change if the test demands it, and say so in the commit.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/tokens.ts src/waterworks/content/layout.ts src/waterworks/content/marks.test.ts src/waterworks/scene/Pools.tsx
git commit -m "waterworks: make the retention line a pale mineral mark, testable against its waterline"
```

---

### Task 6: Look at it

The whole pass exists because tests passed while the water was underground. Nothing here is done until it has been seen. This task has no unit tests by design — it is the falsification step.

**Files:**
- Modify: any of `src/waterworks/terrain/water.ts` (the `WATER_SURFACE` numbers), `src/waterworks/tokens.ts` — tuning only, if the look demands it.

**Interfaces:**
- Consumes: everything above. Produces: no new exports.

- [ ] **Step 1: Start the preview and open the Waterworks**

Use the Browser pane's `preview_start` with `{name: "foundry-dev"}` — never `pnpm dev` in a shell. Then navigate to `http://localhost:<port>/conversion-foundry/#/waterworks`.

The hash is dropped on a full reload, and the app falls back to the Foundry — if the screenshot shows a dark scene with neon accents, that is the other view, not a broken Waterworks. Re-navigate to the hash.

- [ ] **Step 2: Capture the overlook**

Screenshot at the default camera. Check, explicitly:
- the eleven channels read as **water**, not as beaded lines of kerb stone
- the colour grade is visible along the run — ochre at the three rills, blue-grey by the draw-offs
- no channel has water standing above its bank or spilling onto grade

- [ ] **Step 3: Capture a pool at the water's edge**

The camera dollies far too slowly by mouse wheel to reach the pools in a reasonable number of calls. Drive it directly:

```js
(() => {
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  for (let i = 0; i < 45; i++) {
    c.dispatchEvent(new WheelEvent('wheel', {
      deltaY: -120, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
      bubbles: true, cancelable: true,
    }));
  }
  return 'dollied in';
})();
```

Drag **upward** on the canvas to lower the camera toward the horizon (dragging down raises it to plan view). Then screenshot and check:
- the **pale retention line** is visible through the water on the basin wall
- the **silt floor** is visible through the water
- the gauge post and the water surface still read as distinct marks — four marks, four kinds

- [ ] **Step 4: Tune if needed, then re-verify**

If the channels still read thin at the overlook, raise `WATER_SURFACE.channelFill` toward 0.9 — the rim guard in `buildChannelRibbon` prevents it flooding, and the ribbon widens automatically because `waterHalfWidth` derives from the fill. If the pools read milky rather than clear, drop `poolOpacity` toward 0.45.

After any change: `pnpm vitest run && pnpm typecheck`, then repeat Steps 2–3. Test bounds are deliberately wider than the chosen values so ordinary tuning does not require editing assertions — if a tuning value hits a bound, stop and reconsider rather than widening the bound.

- [ ] **Step 5: Commit the tuning and update the handoff**

Update `docs/superpowers/HANDOFF.md`: strike open items 1 and 2, record the buried-ribbon finding and that open item 5 (pool `roughness`/`opacity`) is now a decision rather than an inherited guess. Leave items 3, 4 and 6 open.

```bash
git add -A
git commit -m "waterworks: tune the water surfaces against the overlook and the pool edge"
```

---

## Self-Review

**Spec coverage.** §7's colour grade — Task 3, now measured against the soil. §7's "still water reflecting" — Task 4, `poolRoughness`. §5.4's retention line and its submersion — Task 5, asserted rather than assumed. §10.1's four marks differing in kind — Task 5, the pale-line change plus the transmission bound. §10.1's legibility risk ("the most likely thing to go muddy") — Task 6 checks it by eye, which is the only way it can be checked.

**Not covered, deliberately:** the tile-boundary line (open item 4), the unmeasured 60fps (item 3), and the CLAUDE.md bloom exception (item 6). All independent of water legibility; folding them in would blur the checkpoint. §11.3 (gates) begins after this pass lands.

**Type consistency.** `WATER_SURFACE` members are referenced as `channelFill`, `widthSafety`, `freeboard`, `bedClearance`, `channelOpacity`, `channelRoughness`, `poolOpacity`, `poolRoughness` in Tasks 1, 2, 4 and 5 — one spelling throughout. `buildChannelRibbon` drops its third parameter in Task 2 and every call site is updated in Task 4; no other caller exists — `grep -rn buildChannelRibbon src` returns `water.ts`, `water.test.ts` and `ChannelWater.tsx`, plus one mention in `waterMaterial.ts` that is a doc comment about the V coordinate, not a call. `RETENTION_STAIN_HEIGHT` replaces the file-local `STAIN_HEIGHT` at both of its use sites in `Pools.tsx`.

**Ordering.** Task 2 knowingly leaves `pnpm typecheck` red until Task 4 — called out in both tasks so an implementer working a single task does not chase it.
