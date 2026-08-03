# Waterworks §11.1 — Static Hillside Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dry, static, non-interactive hillside for the dentist scenario at final visual fidelity, so the R3F rendering decision (§9.1) can be judged by looking at it.

**Architecture:** A second view mounted by hash route (`#/waterworks`) alongside the existing Foundry, sharing the Vite app but nothing else yet. Terrain is a procedural heightfield: a strictly-descending base fall, plus deterministic fBm for irregularity, minus incision along channel splines and minus carved pool basins. All pure geometry math lives in testable modules with no Three.js or React dependency; the R3F components are thin assemblers over those functions.

**Tech Stack:** Vite 6, React 18, TypeScript strict, @react-three/fiber 8, @react-three/drei 9, @react-three/postprocessing 2, Three 0.169, Tailwind 3, Vitest 3 (new).

## Global Constraints

- **pnpm only.** No npm, no yarn. `packageManager` is pinned to `pnpm@10.33.2`.
- **No external GLTF model files.** All geometry procedural.
- **Fonts:** Instrument Serif (display) and JetBrains Mono (technical labels) only, via @fontsource. No Inter, no Roboto, no system fonts.
- **Pixel ratio capped at 2** (`dpr={[1, 2]}` on the Canvas).
- **60fps target on a recent MacBook Air.**
- **TypeScript strict mode.** No `any`, no non-null assertions on values that can genuinely be null.
- **Vite `base` is `/conversion-foundry/`** — every dev URL in this plan includes that prefix.
- **No placeholder TODOs in committed code.**
- **Visual register (spec §7):** warm limewash / paper ground, ochre and silt soil, weathered timber grey, moss and gorse green. Irregular edges everywhere — nothing CAD-straight. Open sky, low warm sun.
- **Anti-patterns (spec §7):** no glowing emissive lines, no neon on dark, no perfect geometry, no labelling everything. Those belong to the Foundry.

## Scope

**In:** hash routing, the Waterworks view shell, terrain, channel cuts, weirs, sluice gates, the division lip, the client's gate, three platform pool basins plus the final pool, gauge posts, retention stains, silt floors, daylight lighting and postprocessing, the overlook camera.

**Out — deliberately:** water of any kind (that is §11.2), flow, dye, gates that throw, `ClientSite` driving the terrain (§11.5 — the dentist is hardcoded here), the shared-content refactor moving `stations.ts` into `content/` (§11.8), the info panel, the HUD, mode A/B.

**Note on scope creep from §11.8:** this plan pulls the *route switch* forward, because the view cannot be seen without it. It does **not** pull the content refactor forward. `src/data/stations.ts` and `routes.ts` stay exactly where they are.

**Why dry is the right first step:** §11.2 adds water. Building dry first means the §9.1 falsification test — does this look like the Foundry with the lights on? — is judged on terrain, materials and light alone, with no water shader to flatter or confuse it. It also puts three of §10.1's four pool-wall marks (gauge post, retention stain, silt floor) on screen before any water exists, which is the earliest possible test of the legibility risk named in §10.1.

## File Structure

**Created:**

| Path | Responsibility |
| --- | --- |
| `src/shared/router.ts` | `ViewId`, `parseRoute`, `useRoute`. Pure parser plus hook. |
| `src/shared/router.test.ts` | Route parsing tests. |
| `src/waterworks/Waterworks.tsx` | Top-level view: Canvas, scene assembly, view switch. |
| `src/waterworks/ViewSwitch.tsx` | Corner affordance linking between the two views. |
| `src/waterworks/tokens.ts` | `WW_PALETTE` — the earthy palette, one place. |
| `src/waterworks/content/site.ts` | `ClientSite` type + `validateClientSite`. |
| `src/waterworks/content/site.test.ts` | Fixture invariant tests. |
| `src/waterworks/content/dentist.ts` | The dentist fixture. |
| `src/waterworks/content/layout.ts` | The dentist's channel waypoints and basin placements. |
| `src/waterworks/terrain/noise.ts` | Deterministic hash / value noise / fBm. No deps. |
| `src/waterworks/terrain/noise.test.ts` | Determinism, range, continuity. |
| `src/waterworks/terrain/path.ts` | `Vec2`, spline sampling, meander, point-to-polyline distance. |
| `src/waterworks/terrain/path.test.ts` | Endpoint preservation, distance correctness. |
| `src/waterworks/terrain/heightfield.ts` | Base fall, cross slope, incision, basins, grid + color builders. |
| `src/waterworks/terrain/heightfield.test.ts` | Descent, carving, grid shape, color response. |
| `src/waterworks/scene/Terrain.tsx` | Terrain mesh assembler. |
| `src/waterworks/scene/Channels.tsx` | Timber/stone channel linings along the cuts. |
| `src/waterworks/scene/Structures.tsx` | Intake weir, sluice gates, division lip, client's gate. |
| `src/waterworks/scene/Pools.tsx` | Basin rims, gauge posts, retention stains, silt floors. |
| `src/waterworks/scene/Lights.tsx` | Warm key sun + sky hemisphere. |
| `src/waterworks/scene/Sky.tsx` | Two-stop gradient dome. |
| `src/waterworks/scene/Effects.tsx` | Daylight postprocessing variant. |
| `src/waterworks/scene/Camera.tsx` | Long-lens overlook camera + look-around controls. |

**Modified:**

| Path | Change |
| --- | --- |
| `package.json` | Add `vitest` devDep, `test` and `test:watch` scripts. |
| `vite.config.ts` | Add Vitest config block. |
| `src/App.tsx` | Branch on `useRoute()`. |

---

### Task 1: Test harness, hash routing, and an empty Waterworks view

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/shared/router.ts`
- Test: `src/shared/router.test.ts`
- Create: `src/waterworks/Waterworks.tsx`
- Create: `src/waterworks/ViewSwitch.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `type ViewId = 'foundry' | 'waterworks'`; `parseRoute(hash: string): ViewId`; `useRoute(): ViewId`; default-exported `Waterworks()` React component; default-exported `ViewSwitch()` React component.

- [ ] **Step 1: Install Vitest**

```bash
pnpm add -D vitest@^3
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, after `"typecheck"`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Add the Vitest config block to `vite.config.ts`**

Replace the whole file with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/conversion-foundry/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
    port: 5174,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write the failing router test**

Create `src/shared/router.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

describe('parseRoute', () => {
  it('defaults to the foundry when there is no hash', () => {
    expect(parseRoute('')).toBe('foundry');
    expect(parseRoute('#')).toBe('foundry');
  });

  it('recognises the waterworks with or without a leading slash', () => {
    expect(parseRoute('#/waterworks')).toBe('waterworks');
    expect(parseRoute('#waterworks')).toBe('waterworks');
  });

  it('is case-insensitive', () => {
    expect(parseRoute('#/WATERWORKS')).toBe('waterworks');
  });

  it('ignores a query string on the hash', () => {
    expect(parseRoute('#/waterworks?cam=1,2,3')).toBe('waterworks');
  });

  it('falls back to the foundry for unknown routes', () => {
    expect(parseRoute('#/nope')).toBe('foundry');
    expect(parseRoute('#/foundry')).toBe('foundry');
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./router"`.

- [ ] **Step 6: Implement the router**

Create `src/shared/router.ts`:

```ts
import { useEffect, useState } from 'react';

export type ViewId = 'foundry' | 'waterworks';

/**
 * Parse a location hash into a view id. Tolerates a missing leading slash,
 * mixed case, and a trailing query string. Anything unrecognised falls back
 * to the foundry, which is the view that existed first.
 */
export function parseRoute(hash: string): ViewId {
  const clean = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  return clean === 'waterworks' ? 'waterworks' : 'foundry';
}

/** Current view, kept in sync with the address bar. */
export function useRoute(): ViewId {
  const [view, setView] = useState<ViewId>(() =>
    typeof window === 'undefined' ? 'foundry' : parseRoute(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => setView(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return view;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — 5 tests in `src/shared/router.test.ts`.

- [ ] **Step 8: Build the view switch**

Create `src/waterworks/ViewSwitch.tsx`:

```tsx
import type { ViewId } from '../shared/router';

/**
 * Corner affordance between the two explainers. Deliberately not a tab —
 * spec §8: a tab implies they are panes of one thing; they are two
 * experiences of the same content.
 */
export default function ViewSwitch({ current }: { current: ViewId }) {
  const other: ViewId = current === 'waterworks' ? 'foundry' : 'waterworks';
  const label = other === 'waterworks' ? 'The Waterworks' : 'The Foundry';

  return (
    <a
      href={`#/${other}`}
      className="pointer-events-auto absolute bottom-5 right-5 z-20 rounded-sm border border-black/20 bg-white/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-black/70 backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-black"
    >
      {label} →
    </a>
  );
}
```

- [ ] **Step 9: Build the empty Waterworks shell**

Create `src/waterworks/Waterworks.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import ViewSwitch from './ViewSwitch';

export default function Waterworks() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 120, 165], fov: 22, near: 1, far: 400 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#e7dcc7');
        }}
      >
        <Suspense fallback={null} />
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
```

- [ ] **Step 10: Branch `App.tsx` on the route**

In `src/App.tsx`, add these imports below the existing import block:

```tsx
import { useRoute } from './shared/router';
import Waterworks from './waterworks/Waterworks';
```

Then replace the default export at the bottom of the file:

```tsx
export default function App() {
  const view = useRoute();
  if (view === 'waterworks') return <Waterworks />;
  return (
    <SelectionProvider>
      <AppInner />
    </SelectionProvider>
  );
}
```

- [ ] **Step 11: Verify both views mount**

Run: `pnpm typecheck`
Expected: no output, exit 0.

Start the dev server and check both routes:

```bash
pnpm dev
```

Open `http://localhost:5174/conversion-foundry/#/waterworks` — expect a flat warm limewash field filling the viewport, and a "The Foundry →" link bottom-right.
Open `http://localhost:5174/conversion-foundry/#/foundry` — expect the existing Foundry scene, unchanged and fully working.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/shared src/waterworks src/App.tsx
git commit -m "waterworks: hash routing, vitest harness, empty view shell"
```

---

### Task 2: Palette, `ClientSite` type, and the dentist fixture

**Files:**
- Create: `src/waterworks/tokens.ts`
- Create: `src/waterworks/content/site.ts`
- Create: `src/waterworks/content/dentist.ts`
- Test: `src/waterworks/content/site.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `WW_PALETTE` (a `const` object of hex strings); `type ClientSite`; `validateClientSite(site: ClientSite): string[]`; `DENTIST: ClientSite`.

- [ ] **Step 1: Write the palette**

Create `src/waterworks/tokens.ts`:

```ts
/**
 * The Waterworks palette — spec §7. Warm limewash ground, ochre and silt
 * soil, weathered timber grey, moss and gorse at the edges. Deliberately
 * shares nothing with the Foundry's COLORS, which are emissive accents on
 * dark; these are surface albedos in daylight.
 */
export const WW_PALETTE = {
  skyHigh: '#aec4d2',
  skyLow: '#e7dcc7',
  sun: '#fff2d9',
  hemiGround: '#c2a878',
  haze: '#dcd2bd',

  soilDry: '#b39a70',
  soilDamp: '#7c6444',
  silt: '#6a5940',

  rock: '#9c9488',
  rockWet: '#726b60',
  timber: '#8b8478',
  timberDark: '#6d6659',

  moss: '#6c7b4b',
  gorse: '#909657',

  retentionStain: '#5f5344',
} as const;

export type WwColor = keyof typeof WW_PALETTE;
```

- [ ] **Step 2: Write the failing fixture test**

Create `src/waterworks/content/site.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateClientSite } from './site';
import { DENTIST } from './dentist';

describe('validateClientSite', () => {
  it('accepts the dentist fixture', () => {
    expect(validateClientSite(DENTIST)).toEqual([]);
  });

  it('rejects an offlineShare outside 0..1', () => {
    const bad = { ...DENTIST, offlineShare: 1.4 };
    expect(validateClientSite(bad)).toContain('offlineShare must be between 0 and 1');
  });

  it('rejects a non-positive monthlyVolume', () => {
    const bad = { ...DENTIST, monthlyVolume: 0 };
    expect(validateClientSite(bad)).toContain('monthlyVolume must be greater than 0');
  });

  it('rejects an empty conversion list', () => {
    const bad = { ...DENTIST, conversions: [] };
    expect(validateClientSite(bad)).toContain('conversions must not be empty');
  });

  it('rejects an empty discovery list', () => {
    const bad = { ...DENTIST, discovery: [] };
    expect(validateClientSite(bad)).toContain('discovery must not be empty');
  });

  it('rejects a conversion weight outside 0..1', () => {
    const bad = { ...DENTIST, conversions: [{ kind: 'phone' as const, weight: 2 }] };
    expect(validateClientSite(bad)).toContain('conversion weights must be between 0 and 1');
  });
});

describe('DENTIST', () => {
  it('is a phone-led business, which is the whole point of the scenario', () => {
    const phone = DENTIST.conversions.find((c) => c.kind === 'phone');
    expect(phone).toBeDefined();
    const heaviest = DENTIST.conversions.reduce((a, b) => (b.weight > a.weight ? b : a));
    expect(heaviest.kind).toBe('phone');
  });

  it('has a majority-offline tail', () => {
    expect(DENTIST.offlineShare).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./site"`.

- [ ] **Step 4: Implement the type and validator**

Create `src/waterworks/content/site.ts`:

```ts
export type ConversionKind = 'phone' | 'form' | 'walk-in' | 'online-sale' | 'booking';
export type DiscoveryChannel = 'search' | 'maps' | 'social' | 'referral';
export type SiteGround = 'wordpress-full' | 'wix-locked' | 'shopify' | 'custom';
export type Restriction = 'regulated' | 'no-PII' | 'no-remarketing';
export type Literacy = 'one-question' | 'instrument-wall';

export type Conversion = {
  kind: ConversionKind;
  /** Relative worth to the client, 0..1. Not a currency value. */
  weight: number;
};

/** Spec §4 — the brief as data. Everything downstream derives from this. */
export type ClientSite = {
  id: string;
  name: string;
  sector: string;
  /** What they actually want, in their words. */
  goal: string;
  conversions: Conversion[];
  discovery: DiscoveryChannel[];
  ground: SiteGround;
  restrictions: Restriction[];
  /** 0..1 — how much success is invisible online. */
  offlineShare: number;
  /** Drives drought and flood behaviour. */
  monthlyVolume: number;
  literacy: Literacy;
};

/** Returns a list of problems. An empty list means the site is usable. */
export function validateClientSite(site: ClientSite): string[] {
  const problems: string[] = [];

  if (site.offlineShare < 0 || site.offlineShare > 1) {
    problems.push('offlineShare must be between 0 and 1');
  }
  if (site.monthlyVolume <= 0) {
    problems.push('monthlyVolume must be greater than 0');
  }
  if (site.conversions.length === 0) {
    problems.push('conversions must not be empty');
  }
  if (site.discovery.length === 0) {
    problems.push('discovery must not be empty');
  }
  if (site.conversions.some((c) => c.weight < 0 || c.weight > 1)) {
    problems.push('conversion weights must be between 0 and 1');
  }

  return problems;
}
```

- [ ] **Step 5: Implement the dentist fixture**

Create `src/waterworks/content/dentist.ts`:

```ts
import type { ClientSite } from './site';

/**
 * Spec §4 — the onramp scenario. The hard part is that the offline tail is
 * immediate and local: a phone call. The proxy has to be placed at the
 * moment of intent, because nothing downstream of the call is visible.
 */
export const DENTIST: ClientSite = {
  id: 'dentist',
  name: 'Northgate Dental',
  sector: 'Local healthcare',
  goal: 'More new-patient appointments. Not more website traffic.',
  conversions: [
    { kind: 'phone', weight: 1.0 },
    { kind: 'booking', weight: 0.9 },
    { kind: 'form', weight: 0.6 },
  ],
  discovery: ['search', 'maps'],
  ground: 'wordpress-full',
  restrictions: ['no-PII'],
  offlineShare: 0.62,
  monthlyVolume: 2400,
  literacy: 'one-question',
};
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 8 tests across `router.test.ts` and `site.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/waterworks/tokens.ts src/waterworks/content
git commit -m "waterworks: palette tokens, ClientSite type, dentist fixture"
```

---

### Task 3: Deterministic noise

**Files:**
- Create: `src/waterworks/terrain/noise.ts`
- Test: `src/waterworks/terrain/noise.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `hash2(ix: number, iy: number, seed: number): number`; `valueNoise2D(x: number, y: number, seed?: number): number`; `fbm2D(x: number, y: number, seed?: number, octaves?: number): number`. All return values in `[0, 1)`.

Deterministic noise, not `Math.random`, because the terrain must be identical on every load — §11.5 will make it vary by `ClientSite`, and a scenario that looks different each visit is untestable and unreviewable.

- [ ] **Step 1: Write the failing test**

Create `src/waterworks/terrain/noise.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fbm2D, hash2, valueNoise2D } from './noise';

describe('hash2', () => {
  it('is deterministic', () => {
    expect(hash2(3, 7, 42)).toBe(hash2(3, 7, 42));
  });

  it('stays in [0, 1)', () => {
    for (let x = -50; x < 50; x += 7) {
      for (let y = -50; y < 50; y += 11) {
        const n = hash2(x, y, 1);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
      }
    }
  });

  it('separates neighbouring cells', () => {
    expect(hash2(3, 7, 42)).not.toBe(hash2(4, 7, 42));
    expect(hash2(3, 7, 42)).not.toBe(hash2(3, 8, 42));
  });

  it('separates seeds', () => {
    expect(hash2(3, 7, 42)).not.toBe(hash2(3, 7, 43));
  });
});

describe('valueNoise2D', () => {
  it('equals the lattice hash at integer coordinates', () => {
    expect(valueNoise2D(4, 9, 5)).toBeCloseTo(hash2(4, 9, 5), 10);
  });

  it('is continuous — a small step gives a small change', () => {
    const a = valueNoise2D(2.5, 3.5, 0);
    const b = valueNoise2D(2.501, 3.5, 0);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });

  it('stays in [0, 1]', () => {
    for (let x = 0; x < 20; x += 0.37) {
      const n = valueNoise2D(x, x * 1.7, 3);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
  });
});

describe('fbm2D', () => {
  it('stays in [0, 1]', () => {
    for (let x = 0; x < 30; x += 0.53) {
      const n = fbm2D(x, x * 0.8, 11, 4);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic', () => {
    expect(fbm2D(1.25, 4.5, 9, 5)).toBe(fbm2D(1.25, 4.5, 9, 5));
  });

  it('varies across the domain', () => {
    const samples = new Set<number>();
    for (let x = 0; x < 10; x += 0.9) samples.add(fbm2D(x, 0, 2, 4));
    expect(samples.size).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/waterworks/terrain/noise.test.ts`
Expected: FAIL — `Failed to resolve import "./noise"`.

- [ ] **Step 3: Implement the noise**

Create `src/waterworks/terrain/noise.ts`:

```ts
/**
 * Integer lattice hash. Uses Math.imul throughout so the arithmetic stays in
 * 32-bit integer space — plain `*` would silently lose precision above 2^53
 * and make the terrain non-reproducible across machines.
 */
export function hash2(ix: number, iy: number, seed: number): number {
  let h =
    Math.imul(ix | 0, 374761393) +
    Math.imul(iy | 0, 668265263) +
    Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** Hermite fade — zero first derivative at both ends, so cells don't crease. */
function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Bilinear value noise over the integer lattice. */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);

  const top = n00 + (n10 - n00) * fx;
  const bottom = n01 + (n11 - n01) * fx;
  return top + (bottom - top) * fy;
}

/**
 * Fractal Brownian motion — octaves of value noise at doubling frequency and
 * halving amplitude, normalised back into [0, 1]. Each octave gets its own
 * seed offset so the lattices don't align and produce visible grid artefacts.
 */
export function fbm2D(x: number, y: number, seed = 0, octaves = 4): number {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * frequency, y * frequency, seed + i * 101) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return sum / norm;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/waterworks/terrain/noise.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/noise.ts src/waterworks/terrain/noise.test.ts
git commit -m "waterworks: deterministic value noise and fbm"
```

---

### Task 4: Channel paths

**Files:**
- Create: `src/waterworks/terrain/path.ts`
- Test: `src/waterworks/terrain/path.test.ts`

**Interfaces:**
- Consumes: `fbm2D` from `./noise`.
- Produces: `type Vec2 = { x: number; z: number }`; `sampleSpline(waypoints: Vec2[], samplesPerSegment: number): Vec2[]`; `meander(pts: Vec2[], amplitude: number, seed: number): Vec2[]`; `distanceToPolyline(x: number, z: number, pts: Vec2[]): number`; `polylineLength(pts: Vec2[]): number`.

Paths are defined purely in plan (x, z). They do not consult the terrain — the terrain consults *them*, in Task 5, to cut itself. That ordering is what keeps the two modules acyclic.

- [ ] **Step 1: Write the failing test**

Create `src/waterworks/terrain/path.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { distanceToPolyline, meander, polylineLength, sampleSpline, type Vec2 } from './path';

const STRAIGHT: Vec2[] = [
  { x: 0, z: 0 },
  { x: 0, z: 10 },
  { x: 0, z: 20 },
  { x: 0, z: 30 },
];

describe('sampleSpline', () => {
  it('preserves the first and last waypoint exactly', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    expect(pts[0]).toEqual({ x: 0, z: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 0, z: 30 });
  });

  it('stays on the line through collinear waypoints', () => {
    for (const p of sampleSpline(STRAIGHT, 8)) {
      expect(Math.abs(p.x)).toBeLessThan(1e-9);
    }
  });

  it('produces a denser polyline than the input', () => {
    expect(sampleSpline(STRAIGHT, 8).length).toBeGreaterThan(STRAIGHT.length);
  });

  it('returns the input unchanged when there is nothing to interpolate', () => {
    expect(sampleSpline([{ x: 1, z: 2 }], 8)).toEqual([{ x: 1, z: 2 }]);
  });
});

describe('meander', () => {
  it('pins both endpoints so channels still meet their structures', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    const wobbled = meander(pts, 3, 7);
    expect(wobbled[0].x).toBeCloseTo(pts[0].x, 6);
    expect(wobbled[0].z).toBeCloseTo(pts[0].z, 6);
    expect(wobbled[wobbled.length - 1].x).toBeCloseTo(pts[pts.length - 1].x, 6);
  });

  it('actually displaces the middle', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    const wobbled = meander(pts, 3, 7);
    const mid = Math.floor(pts.length / 2);
    expect(Math.abs(wobbled[mid].x - pts[mid].x)).toBeGreaterThan(0.05);
  });

  it('respects the amplitude ceiling', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    for (const p of meander(pts, 2, 3)) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(2.0001);
    }
  });
});

describe('distanceToPolyline', () => {
  it('is zero on the line', () => {
    expect(distanceToPolyline(0, 15, STRAIGHT)).toBeCloseTo(0, 6);
  });

  it('measures perpendicular offset', () => {
    expect(distanceToPolyline(4, 15, STRAIGHT)).toBeCloseTo(4, 6);
  });

  it('measures from the endpoint when past the end', () => {
    expect(distanceToPolyline(0, 34, STRAIGHT)).toBeCloseTo(4, 6);
  });
});

describe('polylineLength', () => {
  it('sums the segments', () => {
    expect(polylineLength(STRAIGHT)).toBeCloseTo(30, 6);
  });

  it('is zero for a degenerate polyline', () => {
    expect(polylineLength([{ x: 1, z: 1 }])).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/waterworks/terrain/path.test.ts`
Expected: FAIL — `Failed to resolve import "./path"`.

- [ ] **Step 3: Implement the path module**

Create `src/waterworks/terrain/path.ts`:

```ts
import { fbm2D } from './noise';

export type Vec2 = { x: number; z: number };

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Catmull-Rom through the waypoints. The curve passes through every control
 * point, which matters because the waypoints are where structures sit — a
 * spline that only approximates them would leave weirs off their channels.
 */
export function sampleSpline(waypoints: Vec2[], samplesPerSegment: number): Vec2[] {
  if (waypoints.length < 2) return waypoints.map((p) => ({ ...p }));

  const pts: Vec2[] = [];
  const n = waypoints.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(n - 1, i + 2)];
    const isLast = i === n - 2;
    const count = isLast ? samplesPerSegment + 1 : samplesPerSegment;

    for (let s = 0; s < count; s++) {
      const t = s / samplesPerSegment;
      pts.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        z: catmullRom(p0.z, p1.z, p2.z, p3.z, t),
      });
    }
  }

  return pts;
}

/**
 * Push each interior point sideways along its normal by a noise offset,
 * tapered to zero at both ends. Spec §7: channels meander, nothing is
 * CAD-straight — but the ends must stay pinned to their structures.
 */
export function meander(pts: Vec2[], amplitude: number, seed: number): Vec2[] {
  if (pts.length < 3) return pts.map((p) => ({ ...p }));

  const last = pts.length - 1;
  return pts.map((p, i) => {
    if (i === 0 || i === last) return { ...p };

    const prev = pts[i - 1];
    const next = pts[i + 1];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    // Left-hand normal of the local tangent.
    const nx = -dz / len;
    const nz = dx / len;

    const t = i / last;
    // Sine taper: zero at both ends, one in the middle.
    const taper = Math.sin(Math.PI * t);
    const offset = (fbm2D(p.x * 0.12, p.z * 0.12, seed, 3) - 0.5) * 2 * amplitude * taper;

    return { x: p.x + nx * offset, z: p.z + nz * offset };
  });
}

function distanceToSegment(x: number, z: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(x - a.x, z - a.z);

  let t = ((x - a.x) * dx + (z - a.z) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
}

/** Shortest distance from a point to the polyline, in world units. */
export function distanceToPolyline(x: number, z: number, pts: Vec2[]): number {
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) return Math.hypot(x - pts[0].x, z - pts[0].z);

  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanceToSegment(x, z, pts[i], pts[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export function polylineLength(pts: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
  }
  return total;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/waterworks/terrain/path.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/path.ts src/waterworks/terrain/path.test.ts
git commit -m "waterworks: channel path splines, meander, polyline distance"
```

---

### Task 5: The dentist layout

**Files:**
- Create: `src/waterworks/content/layout.ts`

**Interfaces:**
- Consumes: `Vec2`, `sampleSpline`, `meander` from `../terrain/path`.
- Produces: `type ChannelCut = { id: string; pts: Vec2[]; halfWidth: number; depth: number }`; `type BasinSpec = { id: string; label: string; center: Vec2; radius: number; depth: number; rimWidth: number; retentionFrac: number }`; `DENTIST_CHANNELS: ChannelCut[]`; `DENTIST_BASINS: BasinSpec[]`; `HEADWORKS`, `DIVISION_LIP`, `CLIENT_GATE` position constants.

No test — this file is coordinate data with no logic. Task 6's tests exercise it indirectly by carving with it, and the real check is visual.

- [ ] **Step 1: Write the layout**

Create `src/waterworks/content/layout.ts`:

```ts
import { meander, sampleSpline, type Vec2 } from '../terrain/path';

export type ChannelCut = {
  id: string;
  pts: Vec2[];
  /** Half-width of the cut at grade, in world units. */
  halfWidth: number;
  /** Incision below surrounding grade, in world units. */
  depth: number;
};

export type BasinSpec = {
  id: string;
  label: string;
  center: Vec2;
  radius: number;
  depth: number;
  /** How far in from the rim the floor flattens out. */
  rimWidth: number;
  /** Retention line height as a fraction of depth, measured from the floor. */
  retentionFrac: number;
};

/** Where the intake weir stands, at the head of the cut network. */
export const HEADWORKS: Vec2 = { x: 0, z: -24 };

/** The level lip that feeds every destination channel at once — spec §10.1. */
export const DIVISION_LIP: Vec2 = { x: 0, z: -9 };

/** Off-system, on land you do not control — spec §3. */
export const CLIENT_GATE: Vec2 = { x: -26, z: -4 };

function cut(id: string, waypoints: Vec2[], halfWidth: number, depth: number, seed: number): ChannelCut {
  return {
    id,
    pts: meander(sampleSpline(waypoints, 10), halfWidth * 0.75, seed),
    halfWidth,
    depth,
  };
}

/**
 * The dentist's network, upstream to downstream. Three feeder rills converge
 * at the intake weir; a gated reach runs down to the division lip; three
 * destination channels leave the lip together; three draw-offs return to the
 * final pool. Widths narrow downstream because a draw-off carries less than
 * a trunk.
 */
export const DENTIST_CHANNELS: ChannelCut[] = [
  cut('rill-west', [{ x: -11, z: -37 }, { x: -7, z: -32 }, { x: -2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 11),
  cut('rill-centre', [{ x: 1, z: -38 }, { x: 0.5, z: -32 }, { x: 0.2, z: -27 }, HEADWORKS], 0.55, 0.5, 23),
  cut('rill-east', [{ x: 9, z: -36 }, { x: 6, z: -31 }, { x: 2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 37),

  cut('gated-reach', [HEADWORKS, { x: -0.6, z: -19 }, { x: 0.8, z: -14 }, DIVISION_LIP], 1.15, 0.85, 5),

  cut('to-ga4', [DIVISION_LIP, { x: -6, z: -6 }, { x: -12, z: -1 }, { x: -14, z: 3 }], 0.85, 0.7, 41),
  cut('to-ads', [DIVISION_LIP, { x: 0.4, z: -4 }, { x: 0, z: 1 }, { x: 0, z: 5 }], 0.85, 0.7, 53),
  cut('to-meta', [DIVISION_LIP, { x: 6, z: -6 }, { x: 11, z: -2 }, { x: 13, z: 2 }], 0.85, 0.7, 67),

  cut('draw-ga4', [{ x: -14, z: 7 }, { x: -10, z: 13 }, { x: -4, z: 18 }, { x: -1.2, z: 21 }], 0.5, 0.45, 71),
  cut('draw-ads', [{ x: 0, z: 9 }, { x: 0, z: 14 }, { x: 0, z: 18 }, { x: 0, z: 21 }], 0.5, 0.45, 83),
  cut('draw-meta', [{ x: 13, z: 6 }, { x: 9, z: 12 }, { x: 4, z: 18 }, { x: 1.2, z: 21 }], 0.5, 0.45, 97),

  cut('client-gate-run', [CLIENT_GATE, { x: -21, z: -5 }, { x: -16, z: -7 }, { x: -11, z: -8.4 }, { x: -2, z: -9 }], 0.6, 0.5, 103),
];

/**
 * Three platform pools at the same elevation — peers, no hierarchy (§3, §10.1)
 * — and the final pool below them. Retention fractions differ per pool: GA4
 * reaches deepest, Meta shallowest (§10.1).
 */
export const DENTIST_BASINS: BasinSpec[] = [
  { id: 'ga4', label: 'GA4', center: { x: -14, z: 5 }, radius: 4.6, depth: 2.1, rimWidth: 1.5, retentionFrac: 0.12 },
  { id: 'ads', label: 'Google Ads', center: { x: 0, z: 7 }, radius: 4.2, depth: 1.7, rimWidth: 1.4, retentionFrac: 0.42 },
  { id: 'meta', label: 'Meta', center: { x: 13, z: 4 }, radius: 4.4, depth: 1.6, rimWidth: 1.4, retentionFrac: 0.55 },
  { id: 'final', label: 'The pool', center: { x: 0, z: 25 }, radius: 6.4, depth: 2.4, rimWidth: 2.0, retentionFrac: 0.2 },
];
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm typecheck`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/waterworks/content/layout.ts
git commit -m "waterworks: dentist channel and basin layout"
```

---

### Task 6: The heightfield

**Files:**
- Create: `src/waterworks/terrain/heightfield.ts`
- Test: `src/waterworks/terrain/heightfield.test.ts`

**Interfaces:**
- Consumes: `fbm2D` from `./noise`; `distanceToPolyline`, `Vec2` from `./path`; `ChannelCut`, `BasinSpec` from `../content/layout`.
- Produces: `TERRAIN` (bounds and resolution constants); `clamp01(x: number): number`; `smoothstep(edge0: number, edge1: number, x: number): number`; `baseFall(z: number): number`; `crossSlope(x: number): number`; `surfaceHeight(x: number, z: number): number`; `carvedHeight(x: number, z: number, cuts: ChannelCut[], basins: BasinSpec[]): number`; `buildTerrainGrid(height: (x: number, z: number) => number): { positions: Float32Array; indices: Uint32Array; nx: number; nz: number }`; `buildTerrainColors(positions: Float32Array): Float32Array`.

- [ ] **Step 1: Write the failing test**

Create `src/waterworks/terrain/heightfield.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  baseFall,
  buildTerrainColors,
  buildTerrainGrid,
  carvedHeight,
  clamp01,
  smoothstep,
  surfaceHeight,
  TERRAIN,
} from './heightfield';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';

describe('clamp01', () => {
  it('clamps both ends', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(9)).toBe(1);
  });
});

describe('smoothstep', () => {
  it('is 0 at edge0 and 1 at edge1', () => {
    expect(smoothstep(0, 10, 0)).toBeCloseTo(0, 9);
    expect(smoothstep(0, 10, 10)).toBeCloseTo(1, 9);
  });

  it('works with a descending edge pair', () => {
    expect(smoothstep(10, 0, 10)).toBeCloseTo(0, 9);
    expect(smoothstep(10, 0, 0)).toBeCloseTo(1, 9);
  });
});

describe('baseFall', () => {
  it('falls strictly from ridge to outfall', () => {
    let prev = Infinity;
    for (let z = TERRAIN.zMin; z < TERRAIN.zMax; z += 1) {
      const h = baseFall(z);
      expect(h).toBeLessThan(prev);
      prev = h;
    }
  });

  it('spans exactly the configured drop', () => {
    expect(baseFall(TERRAIN.zMin)).toBeCloseTo(TERRAIN.ridgeHeight, 6);
    expect(baseFall(TERRAIN.zMax)).toBeCloseTo(TERRAIN.outfallHeight, 6);
  });
});

describe('surfaceHeight', () => {
  it('is deterministic', () => {
    expect(surfaceHeight(3.5, -12.25)).toBe(surfaceHeight(3.5, -12.25));
  });

  it('descends grossly from the catchment to the outfall', () => {
    expect(surfaceHeight(0, TERRAIN.zMin)).toBeGreaterThan(surfaceHeight(0, TERRAIN.zMax) + 8);
  });

  it('rises towards the valley sides', () => {
    expect(surfaceHeight(28, 0)).toBeGreaterThan(surfaceHeight(0, 0));
  });
});

describe('carvedHeight', () => {
  it('leaves untouched ground alone', () => {
    const x = 26;
    const z = -34;
    expect(carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS)).toBeCloseTo(
      surfaceHeight(x, z),
      6,
    );
  });

  it('incises along a channel centreline', () => {
    const centre = DENTIST_CHANNELS[3].pts[Math.floor(DENTIST_CHANNELS[3].pts.length / 2)];
    const cut = carvedHeight(centre.x, centre.z, DENTIST_CHANNELS, DENTIST_BASINS);
    expect(cut).toBeLessThan(surfaceHeight(centre.x, centre.z) - 0.5);
  });

  it('hollows out each basin to roughly its stated depth', () => {
    for (const basin of DENTIST_BASINS) {
      const floor = carvedHeight(basin.center.x, basin.center.z, [], DENTIST_BASINS);
      const grade = surfaceHeight(basin.center.x, basin.center.z);
      expect(grade - floor).toBeGreaterThan(basin.depth * 0.9);
    }
  });
});

describe('buildTerrainGrid', () => {
  const flat = () => 2;
  const grid = buildTerrainGrid(flat);

  it('spans the configured bounds at the configured resolution', () => {
    expect(grid.nx).toBe(Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) + 1);
    expect(grid.nz).toBe(Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res) + 1);
  });

  it('emits three floats per vertex', () => {
    expect(grid.positions.length).toBe(grid.nx * grid.nz * 3);
  });

  it('emits two triangles per cell', () => {
    expect(grid.indices.length).toBe((grid.nx - 1) * (grid.nz - 1) * 6);
  });

  it('samples the height function into Y', () => {
    for (let i = 1; i < grid.positions.length; i += 3) {
      expect(grid.positions[i]).toBeCloseTo(2, 6);
    }
  });

  it('keeps every index in range', () => {
    const maxIndex = grid.nx * grid.nz - 1;
    for (const idx of grid.indices) {
      expect(idx).toBeLessThanOrEqual(maxIndex);
    }
  });
});

describe('buildTerrainColors', () => {
  it('emits three floats per vertex', () => {
    const grid = buildTerrainGrid((x, z) => carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS));
    expect(buildTerrainColors(grid.positions).length).toBe(grid.positions.length);
  });

  it('darkens cut ground relative to untouched ground', () => {
    const height = (x: number, z: number) => carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS);
    const reach = DENTIST_CHANNELS[3].pts[Math.floor(DENTIST_CHANNELS[3].pts.length / 2)];

    const inCut = new Float32Array([reach.x, height(reach.x, reach.z), reach.z]);
    const onGrade = new Float32Array([26, height(26, -34), -34]);

    const cutColor = buildTerrainColors(inCut);
    const gradeColor = buildTerrainColors(onGrade);

    const luma = (c: Float32Array) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
    expect(luma(cutColor)).toBeLessThan(luma(gradeColor));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/waterworks/terrain/heightfield.test.ts`
Expected: FAIL — `Failed to resolve import "./heightfield"`.

- [ ] **Step 3: Implement the heightfield**

Create `src/waterworks/terrain/heightfield.ts`:

```ts
import type { BasinSpec, ChannelCut } from '../content/layout';
import { fbm2D } from './noise';
import { distanceToPolyline } from './path';

export const TERRAIN = {
  xMin: -30,
  xMax: 30,
  zMin: -40,
  zMax: 40,
  /** World units per grid cell. 0.4 gives ~30k vertices — cheap, and fine
   *  enough that a 1.1-unit-wide channel cut still reads as a cut. */
  res: 0.4,
  ridgeHeight: 13,
  outfallHeight: 0,
  seed: 20260803,
} as const;

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Standard smoothstep. Tolerates edge0 > edge1, which gives an inward ramp. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Strictly decreasing fall from the ridge at zMin to the outfall at zMax.
 * Exponent above 1 puts the steep ground at the top and a gentler working
 * bench through the middle, where the headworks sits.
 */
export function baseFall(z: number): number {
  const t = clamp01((z - TERRAIN.zMin) / (TERRAIN.zMax - TERRAIN.zMin));
  const shaped = 1 - Math.pow(1 - t, 1.6);
  return TERRAIN.ridgeHeight + (TERRAIN.outfallHeight - TERRAIN.ridgeHeight) * shaped;
}

/** Valley walls, so the hillside reads as a catchment rather than a ramp. */
export function crossSlope(x: number): number {
  return Math.pow(Math.abs(x) / TERRAIN.xMax, 2.2) * 7;
}

/** Undisturbed ground — before anything was cut into it. */
export function surfaceHeight(x: number, z: number): number {
  const macro = fbm2D(x * 0.035, z * 0.035, TERRAIN.seed, 4);
  const micro = fbm2D(x * 0.22, z * 0.22, TERRAIN.seed + 7, 3);
  return baseFall(z) + crossSlope(x) + (macro - 0.5) * 3.2 + (micro - 0.5) * 0.45;
}

/**
 * Ground after the basins were dug and the channels cut. Basins first, then
 * channels, so a draw-off entering a pool cuts through the rim rather than
 * being buried by it.
 */
export function carvedHeight(
  x: number,
  z: number,
  cuts: ChannelCut[],
  basins: BasinSpec[],
): number {
  let h = surfaceHeight(x, z);

  for (const basin of basins) {
    const d = Math.hypot(x - basin.center.x, z - basin.center.z);
    h -= basin.depth * smoothstep(basin.radius, basin.radius - basin.rimWidth, d);
  }

  for (const cut of cuts) {
    const d = distanceToPolyline(x, z, cut.pts);
    if (d > cut.halfWidth) continue;
    h -= cut.depth * smoothstep(cut.halfWidth, 0, d);
  }

  return h;
}

/**
 * Sample the height function onto a regular XZ grid. Returns raw typed arrays
 * rather than a BufferGeometry so this stays testable without a GL context.
 */
export function buildTerrainGrid(height: (x: number, z: number) => number): {
  positions: Float32Array;
  indices: Uint32Array;
  nx: number;
  nz: number;
} {
  const nx = Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) + 1;
  const nz = Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res) + 1;

  const positions = new Float32Array(nx * nz * 3);
  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);

  let p = 0;
  for (let iz = 0; iz < nz; iz++) {
    const z = TERRAIN.zMin + iz * TERRAIN.res;
    for (let ix = 0; ix < nx; ix++) {
      const x = TERRAIN.xMin + ix * TERRAIN.res;
      positions[p++] = x;
      positions[p++] = height(x, z);
      positions[p++] = z;
    }
  }

  let t = 0;
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      indices[t++] = a;
      indices[t++] = c;
      indices[t++] = b;
      indices[t++] = b;
      indices[t++] = c;
      indices[t++] = d;
    }
  }

  return { positions, indices, nx, nz };
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Linear-space albedos matching WW_PALETTE.soilDry / soilDamp / silt / moss.
const SOIL_DRY: [number, number, number] = [0.7, 0.6, 0.44];
const SOIL_DAMP: [number, number, number] = [0.49, 0.39, 0.27];
const SILT: [number, number, number] = [0.42, 0.35, 0.25];
const MOSS: [number, number, number] = [0.42, 0.48, 0.29];

/**
 * Per-vertex soil colour. Dampness is inferred from how far a vertex sits
 * below undisturbed grade, so channels and basins read as wet earth with no
 * texture and no second material. Moss speckles the dry ground above.
 */
export function buildTerrainColors(positions: Float32Array): Float32Array {
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const cut = surfaceHeight(x, z) - y;
    const damp = clamp01(cut / 1.2);

    let rgb = lerp3(SOIL_DRY, SOIL_DAMP, damp);
    if (damp > 0.75) {
      rgb = lerp3(rgb, SILT, smoothstep(0.75, 1, damp));
    } else {
      const mossiness = clamp01((fbm2D(x * 0.19, z * 0.19, TERRAIN.seed + 31, 3) - 0.56) * 4);
      rgb = lerp3(rgb, MOSS, mossiness * (1 - damp) * 0.7);
    }

    colors[i] = rgb[0];
    colors[i + 1] = rgb[1];
    colors[i + 2] = rgb[2];
  }

  return colors;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all suites, 53 tests total (5 router, 8 site, 10 noise, 12 path, 18 heightfield).

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/terrain/heightfield.ts src/waterworks/terrain/heightfield.test.ts
git commit -m "waterworks: heightfield with channel incision and basin carving"
```

---

### Task 7: Terrain mesh and the overlook camera

**Files:**
- Create: `src/waterworks/scene/Terrain.tsx`
- Create: `src/waterworks/scene/Camera.tsx`
- Modify: `src/waterworks/Waterworks.tsx`

**Interfaces:**
- Consumes: `buildTerrainGrid`, `buildTerrainColors`, `carvedHeight` from `../terrain/heightfield`; `DENTIST_CHANNELS`, `DENTIST_BASINS` from `../content/layout`.
- Produces: default-exported `Terrain()`; default-exported `Camera()`; `OVERLOOK` camera constant.

This is the first visual checkpoint. Judge the landform silhouette only — lighting and materials arrive in Task 8, so it will look flat and that is expected.

- [ ] **Step 1: Build the terrain component**

Create `src/waterworks/scene/Terrain.tsx`:

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';
import { buildTerrainColors, buildTerrainGrid, carvedHeight } from '../terrain/heightfield';

export default function Terrain() {
  const geometry = useMemo(() => {
    const { positions, indices } = buildTerrainGrid((x, z) =>
      carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS),
    );
    const colors = buildTerrainColors(positions);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0}
        envMapIntensity={0.35}
        flatShading={false}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Build the camera component**

Create `src/waterworks/scene/Camera.tsx`:

```tsx
import { OrbitControls } from '@react-three/drei';

/**
 * Spec §9.1: one long-lens perspective camera, not ortho. At this distance a
 * 22° field of view reads as near-orthographic across the whole hillside,
 * which is what the §10.2 overlook wants; moving in gives natural perspective
 * at the water's edge without a projection change.
 */
export const OVERLOOK = {
  position: [0, 120, 165] as [number, number, number],
  target: [0, 4, -4] as [number, number, number],
  fov: 22,
};

/**
 * §11.1 is non-interactive as far as the *system* goes. Look-around is kept
 * because the deliverable is "look at it" and that cannot be judged from one
 * fixed frame. Clamped so the hillside can never be viewed from below.
 */
export default function Camera() {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      target={OVERLOOK.target}
      minDistance={30}
      maxDistance={280}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI * 0.47}
    />
  );
}
```

- [ ] **Step 3: Mount both in the view**

Replace `src/waterworks/Waterworks.tsx` with:

```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from './tokens';
import Camera, { OVERLOOK } from './scene/Camera';
import Terrain from './scene/Terrain';
import ViewSwitch from './ViewSwitch';

export default function Waterworks() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: OVERLOOK.position, fov: OVERLOOK.fov, near: 1, far: 400 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(WW_PALETTE.skyLow);
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />
          <Terrain />
          <Camera />
        </Suspense>
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
```

The flat `ambientLight` here is temporary scaffolding so the landform is visible before Task 8 replaces it with real lighting.

- [ ] **Step 4: Visual checkpoint — the landform**

Run: `pnpm dev`
Open `http://localhost:5174/conversion-foundry/#/waterworks`.

Confirm all of:
- A valley falls away from the far edge toward the camera, with raised ground on both sides.
- A branching network of cut channels is visible as darker lines: three rills converging near the top, one trunk down the middle, three channels fanning out, three returning to a large basin at the bottom.
- Four circular basins are visibly hollowed — three side by side across the middle, one larger below them.
- One channel enters from the left edge and stops at the boundary (the client's gate).
- No z-fighting, no holes, no black facets.

If channels are invisible, the incision depth is being swamped by fBm amplitude — reduce the `(macro - 0.5) * 3.2` term in `surfaceHeight` before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/scene/Terrain.tsx src/waterworks/scene/Camera.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: terrain mesh and long-lens overlook camera"
```

---

### Task 8: Daylight — sky, lights, and the postprocessing fork

**Files:**
- Create: `src/waterworks/scene/Sky.tsx`
- Create: `src/waterworks/scene/Lights.tsx`
- Create: `src/waterworks/scene/Effects.tsx`
- Modify: `src/waterworks/Waterworks.tsx`

**Interfaces:**
- Consumes: `WW_PALETTE` from `../tokens`.
- Produces: default-exported `Sky()`, `Lights()`, `Effects()`.

**This task is the §9.1 falsification test.** After it, the honest question is whether this looks like the Foundry with the lights on. If it does, stop and report rather than continuing to Task 9.

- [ ] **Step 1: Build the sky dome**

Create `src/waterworks/scene/Sky.tsx`:

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from '../tokens';

/**
 * A two-stop gradient dome rather than drei's <Sky>. Preetham scattering
 * gives a photographic blue that fights the limewash register in §7; this is
 * a painted backdrop, which is what a hand-built hillside wants behind it.
 */
export default function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uHigh: { value: new THREE.Color(WW_PALETTE.skyHigh) },
          uLow: { value: new THREE.Color(WW_PALETTE.skyLow) },
        },
        vertexShader: `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uHigh;
          uniform vec3 uLow;
          varying vec3 vWorld;
          void main() {
            float t = clamp(vWorld.y / 220.0 + 0.18, 0.0, 1.0);
            gl_FragColor = vec4(mix(uLow, uHigh, pow(t, 0.75)), 1.0);
          }
        `,
      }),
    [],
  );

  return (
    <mesh material={material} frustumCulled={false}>
      <sphereGeometry args={[340, 32, 24]} />
    </mesh>
  );
}
```

- [ ] **Step 2: Build the lighting**

Create `src/waterworks/scene/Lights.tsx`:

```tsx
import { WW_PALETTE } from '../tokens';

/**
 * Spec §7: open sky, low warm sun. One key from the west at a shallow angle
 * so channel cuts and weir faces throw long shadows and read as depth, plus
 * a strong sky/ground hemisphere doing the work the Foundry's emissives do.
 * No coloured rim lights — those are the Foundry's signature.
 */
export default function Lights() {
  return (
    <>
      <hemisphereLight
        args={[WW_PALETTE.skyHigh, WW_PALETTE.hemiGround, 1.35]}
        position={[0, 60, 0]}
      />
      <directionalLight
        position={[-52, 30, 34]}
        intensity={2.2}
        color={WW_PALETTE.sun}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-camera-left={-56}
        shadow-camera-right={56}
        shadow-camera-top={56}
        shadow-camera-bottom={-56}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
    </>
  );
}
```

- [ ] **Step 3: Build the daylight postprocessing fork**

Create `src/waterworks/scene/Effects.tsx`:

```tsx
import { Bloom, EffectComposer, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

/**
 * The Foundry's pipeline, inverted. Same composer, opposite settings:
 * SSAO carries the whole read here, because nothing in this scene is
 * emissive (spec §7 forbids it) and contact shadow between cut earth and
 * timber is the only thing making hand-built forms legible.
 *
 * Bloom is present but effectively inert — threshold above 1.0 means nothing
 * in an ACES-mapped daylight scene ever reaches it. It is kept because the
 * project CLAUDE.md requires the ACES + bloom + SSAO pipeline to be in place;
 * drop it once that rule carries an explicit per-view exception.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={31}
        rings={4}
        radius={0.28}
        intensity={6.5}
        luminanceInfluence={0.35}
        worldDistanceThreshold={200}
        worldDistanceFalloff={60}
        worldProximityThreshold={4}
        worldProximityFalloff={1.5}
        bias={0.03}
      />
      <Bloom intensity={0.04} luminanceThreshold={1.05} luminanceSmoothing={0.1} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.34} darkness={0.26} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
```

- [ ] **Step 4: Wire them in and add warm haze**

In `src/waterworks/Waterworks.tsx`, add these imports:

```tsx
import Effects from './scene/Effects';
import Lights from './scene/Lights';
import Sky from './scene/Sky';
```

Replace the `onCreated` handler:

```tsx
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(WW_PALETTE.skyLow);
          // Warm haze, not the Foundry's void — distance should read as dusty
          // air over a valley, so the far ridge softens instead of vanishing.
          scene.fog = new THREE.Fog(WW_PALETTE.haze, 150, 340);
        }}
```

Replace the `<Suspense>` body:

```tsx
        <Suspense fallback={null}>
          <Sky />
          <Lights />
          <Terrain />
          <Effects />
          <Camera />
        </Suspense>
```

- [ ] **Step 5: Visual checkpoint — the register, and the §9.1 verdict**

Run: `pnpm dev`
Open `http://localhost:5174/conversion-foundry/#/waterworks`.

Confirm all of:
- The ground reads as warm ochre earth in daylight, not as a lit dark surface.
- The sun comes from the left at a shallow angle and channel cuts throw visible shadows into themselves.
- The sky is a pale gradient, warm at the horizon and cooler above.
- Nothing glows. No emissive line anywhere.
- Opening `#/foundry` beside it, the two are unmistakably different objects.

Then run the falsification test honestly: **does this look like the Foundry with the lights on?** If yes, stop, capture a screenshot, and report back rather than proceeding — the §9.1 decision has failed its own test and almost nothing is sunk.

Also check the frame budget now, while the scene is at its simplest: open the browser performance panel and confirm a steady 60fps at the overlook. SSAO at `intensity={6.5}` with a normal pass is the most expensive thing in the scene; if the frame budget is already tight here it will not survive Tasks 9 and 10.

- [ ] **Step 6: Commit**

```bash
git add src/waterworks/scene/Sky.tsx src/waterworks/scene/Lights.tsx src/waterworks/scene/Effects.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: daylight sky, low warm sun, inverted postprocessing"
```

---

### Task 9: Channel linings and headworks structures

**Files:**
- Create: `src/waterworks/scene/Channels.tsx`
- Create: `src/waterworks/scene/Structures.tsx`
- Modify: `src/waterworks/Waterworks.tsx`

**Interfaces:**
- Consumes: `DENTIST_CHANNELS`, `DENTIST_BASINS`, `HEADWORKS`, `DIVISION_LIP`, `CLIENT_GATE` from `../content/layout`; `carvedHeight` from `../terrain/heightfield`; `WW_PALETTE` from `../tokens`.
- Produces: default-exported `Channels()`, `Structures()`.

- [ ] **Step 1: Build the channel linings**

Create `src/waterworks/scene/Channels.tsx`:

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

/**
 * Stone edging along the cut channels. Not the water — §11.1 is dry. These
 * are the kerb stones that stop a hand-cut channel collapsing, and they are
 * what makes a cut read as *built* rather than eroded.
 */
export default function Channels() {
  const mesh = useMemo(() => {
    const stone = new THREE.BoxGeometry(1, 1, 1);
    const matrices: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    for (const cut of DENTIST_CHANNELS) {
      // One kerb stone every ~3rd sample, alternating sides, so the edge is
      // irregular — spec §7 forbids CAD-straight everything.
      for (let i = 2; i < cut.pts.length - 2; i += 3) {
        const p = cut.pts[i];
        const prev = cut.pts[i - 1];
        const next = cut.pts[i + 1];
        const dx = next.x - prev.x;
        const dz = next.z - prev.z;
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        const angle = Math.atan2(dx, dz);

        for (const side of [-1, 1]) {
          const jitter = ((i * 37 + (side + 1) * 13) % 11) / 11;
          const off = cut.halfWidth * (0.92 + jitter * 0.22);
          const x = p.x + nx * side * off;
          const z = p.z + nz * side * off;
          const y = carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS);

          q.setFromAxisAngle(up, angle + (jitter - 0.5) * 0.4);
          m.compose(
            new THREE.Vector3(x, y + 0.06, z),
            q,
            new THREE.Vector3(
              cut.halfWidth * (0.5 + jitter * 0.3),
              0.22 + jitter * 0.14,
              cut.halfWidth * (0.9 + jitter * 0.5),
            ),
          );
          matrices.push(m.clone());
        }
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(WW_PALETTE.rock),
      roughness: 0.92,
      metalness: 0,
    });

    const instanced = new THREE.InstancedMesh(stone, material, matrices.length);
    matrices.forEach((mat, i) => instanced.setMatrixAt(i, mat));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    instanced.frustumCulled = false;

    return instanced;
  }, []);

  return <primitive object={mesh} />;
}
```

- [ ] **Step 2: Build the headworks structures**

Create `src/waterworks/scene/Structures.tsx`:

```tsx
import * as THREE from 'three';
import { CLIENT_GATE, DENTIST_BASINS, DENTIST_CHANNELS, DIVISION_LIP, HEADWORKS } from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

function groundAt(x: number, z: number): number {
  return carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS);
}

/** A timber board set in stone slots — the sluice of spec §5.1. */
function SluiceGate({ x, z, width, angle }: { x: number; z: number; width: number; angle: number }) {
  const y = groundAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, angle, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[width, 0.84, 0.14]} />
        <meshStandardMaterial color={WW_PALETTE.timber} roughness={0.95} metalness={0} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow receiveShadow position={[(side * width) / 2 + side * 0.13, 0.5, 0]}>
          <boxGeometry args={[0.26, 1.0, 0.42]} />
          <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Spec §10.1: the weir sorts, it does not share. Built as one level lip with
 * three channel mouths leaving it together — a proportional divider would
 * have been the wrong object.
 */
function DivisionLip() {
  const y = groundAt(DIVISION_LIP.x, DIVISION_LIP.z);
  return (
    <group position={[DIVISION_LIP.x, y, DIVISION_LIP.z]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[7.2, 0.44, 0.9]} />
        <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.88} metalness={0} />
      </mesh>
      {/* Grates: the admission bars on each destination mouth. */}
      {[-2.5, 0, 2.5].map((offset) => (
        <group key={offset} position={[offset, 0.44, 0.5]}>
          {[-0.22, 0, 0.22].map((bar) => (
            <mesh key={bar} castShadow position={[bar, 0.2, 0]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.85} metalness={0.15} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Off-system, on land you do not control — a gate in a boundary wall. */
function ClientGate() {
  const y = groundAt(CLIENT_GATE.x, CLIENT_GATE.z);
  return (
    <group position={[CLIENT_GATE.x, y, CLIENT_GATE.z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.6, 1.1, 0.18]} />
        <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.96} metalness={0} />
      </mesh>
      {[-3.2, 3.2].map((offset) => (
        <mesh key={offset} castShadow receiveShadow position={[offset, 0.45, 0]}>
          <boxGeometry args={[5, 0.9, 0.55]} />
          <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.94} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

export default function Structures() {
  const intakeY = groundAt(HEADWORKS.x, HEADWORKS.z);

  return (
    <group>
      {/* The intake weir — first thing built, hardest to move later (§3). */}
      <group position={[HEADWORKS.x, intakeY, HEADWORKS.z]}>
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[4.4, 0.6, 0.7]} />
          <meshStandardMaterial color={WW_PALETTE.rockWet} roughness={0.9} metalness={0} />
        </mesh>
        {/* The notch the whole system depends on. */}
        <mesh castShadow position={[0, 0.62, 0]}>
          <boxGeometry args={[1.1, 0.3, 0.76]} />
          <meshStandardMaterial color={WW_PALETTE.skyLow} roughness={1} metalness={0} />
        </mesh>
      </group>

      <SluiceGate x={-0.5} z={-20.5} width={1.9} angle={0.06} />
      <SluiceGate x={0.35} z={-15.5} width={1.9} angle={-0.1} />

      <DivisionLip />
      <ClientGate />
    </group>
  );
}
```

- [ ] **Step 3: Mount both**

In `src/waterworks/Waterworks.tsx`, add:

```tsx
import Channels from './scene/Channels';
import Structures from './scene/Structures';
```

and place them inside `<Suspense>` after `<Terrain />`:

```tsx
          <Terrain />
          <Channels />
          <Structures />
```

- [ ] **Step 4: Visual checkpoint — hand-built, not machined**

Run: `pnpm dev`
Open `http://localhost:5174/conversion-foundry/#/waterworks` and zoom in on the headworks (drag to orbit, scroll to zoom).

Confirm all of:
- Kerb stones follow the channel edges with visible irregularity in size and angle — no two identical, no repeating rhythm.
- The intake weir sits across the trunk channel with a notch cut in its top.
- Two timber sluice gates stand in stone slots between the intake and the division lip.
- The division lip is one level stone with three grated mouths leaving it together.
- A gate stands in a wall at the left boundary with nothing built beyond it.
- Structures sit *on* the ground, not floating above or sunk into it.

If anything floats or sinks, `groundAt` is disagreeing with the rendered mesh — confirm `Channels.tsx` and `Structures.tsx` both pass the same `DENTIST_CHANNELS`/`DENTIST_BASINS` arrays that `Terrain.tsx` used.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/scene/Channels.tsx src/waterworks/scene/Structures.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: channel kerbs, intake weir, sluice gates, division lip"
```

---

### Task 10: Pool basins — gauge posts, retention stains, silt floors

**Files:**
- Create: `src/waterworks/scene/Pools.tsx`
- Modify: `src/waterworks/Waterworks.tsx`

**Interfaces:**
- Consumes: `DENTIST_BASINS`, `DENTIST_CHANNELS`, `BasinSpec` from `../content/layout`; `carvedHeight` from `../terrain/heightfield`; `WW_PALETTE` from `../tokens`.
- Produces: default-exported `Pools()`.

**This is the §10.1 legibility test.** Three of the four pool-wall marks land here — gauge post, retention stain, silt floor. The fourth is the water surface and belongs to §11.2. If three marks already fight each other, four will not work, and §10.1 says to cut one.

- [ ] **Step 1: Build the pools**

Create `src/waterworks/scene/Pools.tsx`:

```tsx
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS, type BasinSpec } from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

function floorOf(basin: BasinSpec): number {
  return carvedHeight(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS);
}

/**
 * A marked timber post standing in the basin — spec §10.1. In §11.2 this is
 * what reads a number that disagrees with the water beside it. Dry, it is
 * just a post with graduations, which is the right amount of promise.
 */
function GaugePost({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  const height = basin.depth + 1.5;
  const x = basin.center.x + basin.radius * 0.42;
  const z = basin.center.z + basin.radius * 0.3;

  return (
    <group position={[x, floor, z]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[0.16, height, 0.16]} />
        <meshStandardMaterial color={WW_PALETTE.timber} roughness={0.95} metalness={0} />
      </mesh>
      {/* Graduations, coarser near the top — real staff gauges are read from
          a distance and the fine marks are the ones that silt over. */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.28 + i * (height - 0.4) / 8, 0.085]}>
          <boxGeometry args={[i % 2 === 0 ? 0.16 : 0.1, 0.035, 0.012]} />
          <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The retention line — spec §5.4 and §10.1. A stain band on the basin wall
 * marking the lowest point a side channel can reach. Different height per
 * pool, and the asymmetry is the lesson.
 */
function RetentionStain({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  const y = floor + basin.depth * basin.retentionFrac;

  return (
    <mesh position={[basin.center.x, y, basin.center.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[basin.radius - basin.rimWidth * 0.9, basin.radius - basin.rimWidth * 0.55, 64]} />
      <meshStandardMaterial
        color={WW_PALETTE.retentionStain}
        roughness={1}
        metalness={0}
        transparent
        opacity={0.72}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/** Layered sediment on the basin floor — the immutable record of §5.2. */
function SiltFloor({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  const layers = 3;

  return (
    <group position={[basin.center.x, floor, basin.center.z]}>
      {Array.from({ length: layers }, (_, i) => {
        const t = i / layers;
        return (
          <mesh key={i} receiveShadow position={[0, 0.02 + i * 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[(basin.radius - basin.rimWidth) * (1 - t * 0.22), 48]} />
            <meshStandardMaterial
              color={i === 1 ? WW_PALETTE.soilDamp : WW_PALETTE.silt}
              roughness={1}
              metalness={0}
              polygonOffset
              polygonOffsetFactor={-1 - i}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Pools() {
  return (
    <group>
      {DENTIST_BASINS.map((basin) => (
        <group key={basin.id}>
          <SiltFloor basin={basin} />
          <RetentionStain basin={basin} />
          <GaugePost basin={basin} />
        </group>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Mount it**

In `src/waterworks/Waterworks.tsx`, add:

```tsx
import Pools from './scene/Pools';
```

and place it inside `<Suspense>` after `<Structures />`:

```tsx
          <Structures />
          <Pools />
```

- [ ] **Step 3: Visual checkpoint — three marks, or too many?**

Run: `pnpm dev`
Open `http://localhost:5174/conversion-foundry/#/waterworks` and zoom into each of the four basins in turn.

Confirm all of:
- Each basin has a timber post standing in it with visible graduations.
- Each basin carries a stain band around its wall, and the four bands sit at visibly different heights relative to their floors — GA4 lowest, Meta highest.
- Each basin floor shows layered sediment, with the layers distinguishable.
- No z-fighting between the silt discs, the stain ring, and the terrain.

Then judge the §10.1 legibility risk honestly: **do the three marks read as three different kinds of thing — a standing object, a stain on the wall, a deposit on the floor?** Or do any two collapse into "a horizontal band"? If they collapse now, adding the water surface in §11.2 makes it worse. Report the finding either way; §10.1 already authorises cutting one.

- [ ] **Step 4: Full verification**

Run: `pnpm test`
Expected: PASS — all suites, 53 tests.

Run: `pnpm typecheck`
Expected: no output, exit 0.

Run: `pnpm build`
Expected: exit 0. Note the reported gzipped bundle size and compare against the 1.5MB budget in the project CLAUDE.md.

Open `http://localhost:5174/conversion-foundry/#/foundry` and confirm the Foundry is completely unchanged — the tour, the stations, the routes, the info panel.

- [ ] **Step 5: Commit**

```bash
git add src/waterworks/scene/Pools.tsx src/waterworks/Waterworks.tsx
git commit -m "waterworks: pool basins with gauge posts, retention stains, silt floors"
```

---

## Definition of Done

§11.1 is complete when all of these hold:

- `pnpm test`, `pnpm typecheck` and `pnpm build` all pass.
- `#/waterworks` shows a dry, daylit, hand-built hillside with the dentist's full network cut into it; `#/foundry` is untouched.
- The scene holds 60fps at the overlook on a recent MacBook Air.
- Someone who has seen the Foundry looks at this and does not think "same thing, different colours."

## Two judgements this plan hands back rather than settles

**The §9.1 verdict (Task 8, Step 5).** Whether R3F was the right call is decided by looking at the daylit terrain, not by argument. The plan is sequenced so that this happens as early as it possibly can — after four pure-logic tasks and two rendering tasks, with nothing built on top of it yet.

**The §10.1 four-marks risk (Task 10, Step 3).** Three of the four marks land here. If they already compete, the spec's own instruction is to cut one before §11.2 adds the fourth.

Both are reported, not silently resolved.
