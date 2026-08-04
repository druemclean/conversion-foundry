# Waterworks §11.2 — Flowing Water Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Put running water in the channels and standing water in the pools, graded from muddy ochre at the rills to near-clear at the final pool.

**Architecture:** Flow position is data, not geometry — each channel carries the span of the network it covers, each basin a single point on it. A pure colour ramp maps that position to a water colour, and a pure ribbon builder turns a channel centreline into a water surface. R3F components stay thin assemblers, same as §11.1.

**Tech Stack:** Vite 6, React 18, TypeScript strict, @react-three/fiber 8, drei 9, Three 0.169, Vitest 3.

## Global Constraints

- **pnpm only.** No npm, no yarn.
- **TypeScript strict.** No `any`; no non-null assertions on values that can genuinely be null.
- **`src/waterworks/terrain/` and `src/waterworks/content/` must import no Three.js and no React.** That boundary is what makes them testable in Node, and it has held for eleven tasks. Geometry builders return typed arrays.
- **No external model or texture files.** All geometry and all surface variation procedural.
- **Pixel ratio capped at 2; 60fps target; bundle under 1.5MB gzipped.**
- **Any object built imperatively and handed to R3F as a prop or via `<primitive>` must be disposed in a `useEffect` cleanup.** This codebase has had four such leaks. Follow the pattern in `Terrain.tsx`, `Sky.tsx`, `Channels.tsx`, `Surround.tsx`.
- **Spec §7 — the only "chart" is the water's clarity.** The colour change with descent carries the entire progressive-refinement idea. No legend, no labels, no key.
- **Spec §7 anti-patterns:** nothing glowing, nothing emissive, no neon. This is daylight on matte earth.
- The sibling Foundry (`src/scene/`, `src/ui/`, `src/state/`, `src/data/`) stays untouched.

## Scope

**In:** flow-position data on channels and basins, the water colour ramp, channel water ribbons, pool water surfaces, and a scrolling ripple that makes the water read as moving.

**Out — deliberately:** gates that throw (§11.3), dye tracing (§11.4), the gauge-versus-level disagreement of §10.1, silt layering changes, leaks, side channels, `ClientSite` driving anything (§11.5). Water levels here are authored constants; their *meaning* arrives later.

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/waterworks/terrain/water.ts` | **Create.** `waterColor`, `buildChannelRibbon`. Pure. |
| `src/waterworks/terrain/water.test.ts` | **Create.** Ramp and ribbon tests. |
| `src/waterworks/terrain/types.ts` | **Modify.** Flow fields on `ChannelCut` and `BasinSpec`. |
| `src/waterworks/content/layout.ts` | **Modify.** Populate flow spans and fill fractions. |
| `src/waterworks/scene/ChannelWater.tsx` | **Create.** Water ribbons in the channels. |
| `src/waterworks/scene/PoolWater.tsx` | **Create.** Standing water in the basins. |
| `src/waterworks/scene/waterMaterial.ts` | **Create.** Shared material factory + ripple injection. |
| `src/waterworks/Waterworks.tsx` | **Modify.** Mount both. |

---

### Task 1: Flow position and the colour ramp

**Files:** Create `src/waterworks/terrain/water.ts`, `src/waterworks/terrain/water.test.ts`. Modify `src/waterworks/terrain/types.ts`, `src/waterworks/content/layout.ts`.

**Interfaces produced:** `WATER_STOPS`; `waterColor(t: number): [number, number, number]`; `ChannelCut.flowFrom`/`flowTo`; `BasinSpec.flow`/`fillFrac`.

- [ ] **Step 1: Add the flow fields to `types.ts`**

In `ChannelCut`:

```ts
  /**
   * Where this channel sits in the network, 0 at the rills and 1 at the final
   * pool. Drives the water's colour grade, which per spec §7 is the only chart
   * in the piece — clarity increasing with descent IS the progressive
   * refinement idea, so these are content, not decoration.
   */
  flowFrom: number;
  flowTo: number;
```

In `BasinSpec`:

```ts
  /** Position on the same 0..1 flow scale as ChannelCut. */
  flow: number;
  /** Standing water level as a fraction of depth, measured from the floor. */
  fillFrac: number;
```

- [ ] **Step 2: Write the failing ramp tests**

Create `src/waterworks/terrain/water.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { WATER_STOPS, buildChannelRibbon, waterColor } from './water';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS } from '../content/layout';
import { carvedHeight } from './heightfield';

const luma = (c: [number, number, number]) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;

describe('waterColor', () => {
  it('pins the ends of the ramp', () => {
    expect(waterColor(0)).toEqual(WATER_STOPS[0].rgb);
    expect(waterColor(1)).toEqual(WATER_STOPS[WATER_STOPS.length - 1].rgb);
  });

  it('clamps outside 0..1 instead of extrapolating', () => {
    expect(waterColor(-3)).toEqual(waterColor(0));
    expect(waterColor(9)).toEqual(waterColor(1));
  });

  it('clears monotonically with descent', () => {
    // §7: the colour change with descent carries the whole refinement idea,
    // so a stretch that muddies again would be telling the wrong story.
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const l = luma(waterColor(t));
      expect(l).toBeGreaterThan(prev - 1e-9);
      prev = l;
    }
  });

  it('loses its ochre warmth as it clears', () => {
    const rills = waterColor(0);
    const pool = waterColor(1);
    expect(rills[0] - rills[2]).toBeGreaterThan(pool[0] - pool[2]);
  });

  it('is continuous across every stop', () => {
    for (const stop of WATER_STOPS) {
      const before = waterColor(Math.max(0, stop.at - 0.001));
      const after = waterColor(Math.min(1, stop.at + 0.001));
      for (let k = 0; k < 3; k++) expect(Math.abs(after[k] - before[k])).toBeLessThan(0.02);
    }
  });
});

describe('buildChannelRibbon', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;
  const height = (x: number, z: number) =>
    carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
  const ribbon = buildChannelRibbon(cut, height, 0.12);

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

  it('never stands above the ground beside it', () => {
    // Water above its own bank is the single most obvious wrongness available.
    for (let i = 0; i < ribbon.positions.length; i += 3) {
      const x = ribbon.positions[i];
      const y = ribbon.positions[i + 1];
      const z = ribbon.positions[i + 2];
      expect(y).toBeLessThanOrEqual(height(x, z) + 1e-6);
    }
  });

  it('carries a flow coordinate that increases downstream', () => {
    for (let i = 2; i < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i + 1]).toBeGreaterThanOrEqual(ribbon.uvs[i - 3]);
    }
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm test src/waterworks/terrain/water.test.ts`
Expected: FAIL — cannot resolve `./water`.

- [ ] **Step 4: Implement `water.ts`**

```ts
import type { ChannelCut } from './types';

export type WaterStop = { at: number; rgb: [number, number, number] };

/**
 * Spec §7: water graded from muddy ochre at the rills, through olive, to
 * blue-grey and finally near-clear at the pool. Linear-space values, because
 * these are written into a vertex-colour attribute and Three reads those as
 * already linear — the same trap that made the terrain render too bright.
 */
export const WATER_STOPS: WaterStop[] = [
  { at: 0.0, rgb: [0.152, 0.101, 0.048] },
  { at: 0.38, rgb: [0.118, 0.113, 0.055] },
  { at: 0.72, rgb: [0.086, 0.118, 0.121] },
  { at: 1.0, rgb: [0.104, 0.152, 0.166] },
];

/** Water colour at flow position `t`, clamped at both ends. */
export function waterColor(t: number): [number, number, number] {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  if (c <= WATER_STOPS[0].at) return WATER_STOPS[0].rgb;

  for (let i = 1; i < WATER_STOPS.length; i++) {
    const a = WATER_STOPS[i - 1];
    const b = WATER_STOPS[i];
    if (c <= b.at) {
      const k = (c - a.at) / (b.at - a.at);
      return [
        a.rgb[0] + (b.rgb[0] - a.rgb[0]) * k,
        a.rgb[1] + (b.rgb[1] - a.rgb[1]) * k,
        a.rgb[2] + (b.rgb[2] - a.rgb[2]) * k,
      ];
    }
  }
  return WATER_STOPS[WATER_STOPS.length - 1].rgb;
}

/**
 * A water surface following a channel centreline.
 *
 * `inset` lifts the surface off the channel bed. The bed is the deepest point
 * of the cut, so the surface is placed relative to the *bank* height at each
 * side sample and then lowered — water that stands proud of its own bank is
 * the most obvious wrongness available, and the test asserts it cannot.
 *
 * Returns typed arrays rather than geometry so this stays testable in Node.
 */
export function buildChannelRibbon(
  cut: ChannelCut,
  height: (x: number, z: number) => number,
  inset: number,
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

  const halfWidth = cut.halfWidth * 0.72;
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

    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      const x = p.x + nx * sign * halfWidth;
      const z = p.z + nz * sign * halfWidth;
      // Sit below whichever is lower, the bed at centre or the bank here, so
      // the surface can never break through the ground on a cross slope.
      const y = Math.min(bed, height(x, z)) - inset;

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

- [ ] **Step 5: Populate the flow data in `layout.ts`**

Extend the `cut()` helper to take the flow span, and give each basin its two new fields. Flow spans, upstream to downstream — the three rills share a span because they are peers, and the three destination channels do too:

| channels | flowFrom → flowTo |
| --- | --- |
| `rill-west`, `rill-centre`, `rill-east` | 0.00 → 0.12 |
| `gated-reach` | 0.12 → 0.40 |
| `to-ga4`, `to-ads`, `to-meta` | 0.40 → 0.62 |
| `draw-ga4`, `draw-ads`, `draw-meta` | 0.68 → 0.92 |
| `client-gate-run` | 0.05 → 0.36 |

The client's gate run starts nearly as muddy as the rills and arrives only partly cleared — it is water off land you do not control, and it has been through none of your gates.

Basins: `ga4` flow 0.65 fillFrac 0.72; `ads` flow 0.65 fillFrac 0.55; `meta` flow 0.65 fillFrac 0.62; `final` flow 1.0 fillFrac 0.68. The three platform pools share a flow position because they are peers fed by one lip, and differ only in level — the level *meaning* arrives in a later step, but authoring them unequal now means the difference is already visible.

- [ ] **Step 6: Make the tests pass, then commit**

Run: `pnpm test` — all suites green, count rises from 83. Run `pnpm typecheck`.

```bash
git add src/waterworks/terrain/water.ts src/waterworks/terrain/water.test.ts src/waterworks/terrain/types.ts src/waterworks/content/layout.ts
git commit -m "waterworks: flow positions and the water colour ramp"
```

---

### Task 2: Water in the channels

**Files:** Create `src/waterworks/scene/waterMaterial.ts`, `src/waterworks/scene/ChannelWater.tsx`. Modify `src/waterworks/Waterworks.tsx`.

- [ ] **Step 1: The shared material**

Create `src/waterworks/scene/waterMaterial.ts`. Use `onBeforeCompile` on a standard material rather than a custom `ShaderMaterial`, so the water stays inside the same PBR and ACES pipeline as everything else:

```ts
import * as THREE from 'three';

export type WaterMaterial = THREE.MeshStandardMaterial & { userData: { uTime: { value: number } } };

/**
 * Water as a standard PBR material with a travelling ripple injected into its
 * normal. A custom ShaderMaterial would have to reimplement the lighting and
 * would drift from the rest of the scene; this stays in the same pipeline and
 * only perturbs the surface.
 *
 * The ripple scrolls along V, which `buildChannelRibbon` sets to cumulative
 * distance downstream — so the flow direction is the channel's own direction
 * without anything having to be told which way is downhill.
 */
export function createWaterMaterial(opts: { roughness: number; opacity: number }): WaterMaterial {
  const uTime = { value: 0 };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: opts.roughness,
    metalness: 0,
    transparent: true,
    opacity: opts.opacity,
    side: THREE.DoubleSide,
  }) as WaterMaterial;

  material.userData = { uTime };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = `varying vec2 vFlowUv;\n${shader.vertexShader}`.replace(
      '#include <uv_vertex>',
      '#include <uv_vertex>\n  vFlowUv = uv;',
    );
    shader.fragmentShader = `
      uniform float uTime;
      varying vec2 vFlowUv;
      float ripple(vec2 p) {
        return sin(p.y * 3.1 + p.x * 1.7) * 0.5 + sin(p.y * 7.3 - p.x * 2.9) * 0.5;
      }
      ${shader.fragmentShader}
    `.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
       vec2 fp = vec2(vFlowUv.x, vFlowUv.y - uTime * 0.55);
       float e = 0.15;
       float dHx = ripple(fp + vec2(e, 0.0)) - ripple(fp - vec2(e, 0.0));
       float dHy = ripple(fp + vec2(0.0, e)) - ripple(fp - vec2(0.0, e));
       normal = normalize(normal + vec3(dHx, 0.0, dHy) * 0.16);`,
    );
  };

  return material;
}
```

- [ ] **Step 2: The channel water component**

Create `src/waterworks/scene/ChannelWater.tsx`: build one merged geometry from every channel's ribbon (one draw call), create the material via the factory, drive `uTime` from `useFrame`, and dispose both geometry and material in a `useEffect` cleanup. Merge by concatenating each ribbon's arrays and offsetting indices by the running vertex count.

Use `inset` of `0.1`.

- [ ] **Step 3: Mount and look**

Add `<ChannelWater />` to `Waterworks.tsx` after `<Structures />`.

Run `pnpm typecheck`, `pnpm test`, `pnpm build`. Then look at it: water should run in every channel, visibly muddy at the rills and cooler by the time it reaches the pools, moving downstream. It must not stand above its banks anywhere, and it must not glow.

- [ ] **Step 4: Commit**

```bash
git add src/waterworks/scene/waterMaterial.ts src/waterworks/scene/ChannelWater.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: running water in the channels, graded by descent"
```

---

### Task 3: Standing water in the pools

**Files:** Create `src/waterworks/scene/PoolWater.tsx`. Modify `src/waterworks/Waterworks.tsx`.

- [ ] **Step 1: The component**

Create `src/waterworks/scene/PoolWater.tsx`. For each basin, a `circleGeometry` laid flat at `floor + depth * fillFrac`, radius `radius - rimWidth * 0.5`, tinted with `waterColor(basin.flow)` via a material colour (not vertex colours — a pool is one flat tone). Reuse `createWaterMaterial` with a lower roughness than the channels: standing water is glassier than running water, and §7 asks for still water reflecting.

Each basin gets its own material instance so the colours differ; share one `useFrame` to drive all their `uTime` values.

Dispose every geometry and every material on unmount.

- [ ] **Step 2: Mount, verify, look**

Add `<PoolWater />` after `<ChannelWater />`.

Run `pnpm typecheck`, `pnpm test`, `pnpm build`. Then look: four pools holding water at visibly different levels, the three platform pools alike in colour and the final pool clearest. The retention stain must still be readable on the wall — if the water hides it entirely, say so rather than adjusting `fillFrac` silently, because §10.1's four marks depend on it.

- [ ] **Step 3: Commit**

```bash
git add src/waterworks/scene/PoolWater.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: standing water in the four pools"
```

---

## Definition of Done

- `pnpm test`, `pnpm typecheck`, `pnpm build` all pass; bundle still under budget.
- Water runs in every channel and stands in every pool.
- The grade is legible without any legend: muddy at the rills, clear at the final pool.
- Nothing glows; nothing stands above its bank.
- §11.1's structures, pads and pool marks are all still correct.

## Deliberately deferred

Water level as *meaning* (§10.1's gauge-versus-level disagreement), gates that throw, dye, leaks, side channels. This step makes the system run; it does not yet make it argue.
