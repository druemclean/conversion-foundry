import type { Vec2 } from './path';

export type ChannelCut = {
  id: string;
  pts: Vec2[];
  /** Half-width of the cut at grade, in world units. */
  halfWidth: number;
  /** Incision below surrounding grade, in world units. */
  depth: number;
  /**
   * Where this channel sits in the network, 0 at the rills and 1 at the final
   * pool. Drives the water's colour grade, which per spec §7 is the only chart
   * in the piece — clarity increasing with descent IS the progressive
   * refinement idea, so these are content, not decoration.
   */
  flowFrom: number;
  flowTo: number;
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
  /** Position on the same 0..1 flow scale as ChannelCut. */
  flow: number;
  /** Standing water level as a fraction of depth, measured from the floor. */
  fillFrac: number;
};

/** A levelled platform for a structure to stand on. */
export type PadSpec = {
  id: string;
  center: Vec2;
  /** Y-rotation of the platform, matching the structure standing on it. */
  angle: number;
  /** Half-extent across the flow (the platform's local X). */
  halfWidth: number;
  /** Half-extent along the flow (local Z). Keep small — this is the axis the
   *  channel falls along, and flattening it would stop the water. */
  halfLength: number;
  /** Graded batter back to surrounding ground, beyond the flat core. */
  blend: number;
  /**
   * Footprint and height of the structure this pad carries, in the pad's own
   * local frame. Declared so a test can prove the pad is big enough — without
   * it, shrinking a pad silently re-buries its structure.
   */
  carries: { halfWidth: number; halfLength: number; height: number };
};

/** A PadSpec with its height resolved against the un-padded terrain. */
export type ResolvedPad = PadSpec & { level: number };
