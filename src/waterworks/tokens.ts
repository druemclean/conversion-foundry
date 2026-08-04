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

  /**
   * A pale mineral tide line, not a dark stain. §10.1 needs the four
   * pool-wall marks to differ in kind, and the previous #5f5344 sat at the
   * same luminance as the silt beside it — so it read as shadow, which is
   * the one thing a mark must not do.
   */
  retentionStain: '#cfc4ab',
} as const;

export type WwColor = keyof typeof WW_PALETTE;
