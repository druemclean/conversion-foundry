import { STATIONS } from '../data/stations';
import { TOUR_STOPS } from '../data/tour';

/**
 * Shared intro state. Driven by CameraRig once per session — read in useFrame
 * by stations, routes, and capsules to compose a staggered reveal as the
 * camera settles into the default framing.
 *
 * Module-scoped (not React state) because every frame would otherwise
 * re-render the entire scene tree for a value that's already changing per
 * frame anyway.
 */
export const intro = {
  /** Camera intro progress 0..1. 1 means scene is fully revealed. */
  t: 0,
  /** True until t reaches 1 and CameraRig hands off to the normal rig. */
  active: true,
};

export const INTRO_DURATION_S = 2.4;

/** Tour-path stations first, then non-tour stations. Determines stagger order. */
const STAGGER_ORDER: string[] = (() => {
  const tourIds = TOUR_STOPS.map((s) => s.id);
  const rest = STATIONS.map((s) => s.id).filter((id) => !tourIds.includes(id));
  return [...tourIds, ...rest];
})();

const STATION_STAGGER_STEP = 0.055;
const STATION_FADE_WINDOW = 0.42;

/** Per-station fade-in value 0..1 derived from intro.t and stagger position. */
export function stationIntroT(id: string): number {
  if (!intro.active && intro.t >= 1) return 1;
  const order = STAGGER_ORDER.indexOf(id);
  if (order < 0) return 1;
  const start = order * STATION_STAGGER_STEP;
  const local = (intro.t - start) / STATION_FADE_WINDOW;
  return Math.max(0, Math.min(1, local));
}

const ROUTE_START = 0.45;
const ROUTE_WINDOW = 0.35;

/** Global route fade-in 0..1. Routes appear together after the first stations land. */
export function routeIntroT(): number {
  if (!intro.active && intro.t >= 1) return 1;
  const local = (intro.t - ROUTE_START) / ROUTE_WINDOW;
  return Math.max(0, Math.min(1, local));
}

const CAPSULE_THRESHOLD = 0.72;

/** Capsules only render once the scene is mostly assembled. */
export function capsulesActive(): boolean {
  return intro.t >= CAPSULE_THRESHOLD;
}

/** Capsule emissive fade 0..1 across the tail of the intro. */
export function capsuleFadeT(): number {
  const local = (intro.t - CAPSULE_THRESHOLD) / (1 - CAPSULE_THRESHOLD);
  return Math.max(0, Math.min(1, local));
}
