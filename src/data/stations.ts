export type StationCategory = 'origin' | 'connector' | 'hybrid' | 'observatory';

export type StationDatum = {
  id: string;
  name: string;
  tag: string;
  accent: string;
  category: StationCategory;
  categoryLabel: string;
  position: [number, number, number];
  scale: number;
  fn: string;
  flow: Array<[string, string]>;
  takeaway: string;
};

export const COLORS = {
  cyan: '#5fd4ff',
  amber: '#ffb054',
  magenta: '#d96fff',
  green: '#6fe39a',
} as const;

export const CATEGORY_LABEL: Record<StationCategory, string> = {
  origin: 'ORIGIN',
  connector: 'CONNECTOR',
  hybrid: 'HYBRID PLATFORM',
  observatory: 'OBSERVATORY',
};

export const STATIONS: StationDatum[] = [
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    tag: 'CLIENT-SIDE ROUTER',
    accent: COLORS.cyan,
    category: 'connector',
    categoryLabel: CATEGORY_LABEL.connector,
    position: [0, 0, 0],
    scale: 1.5,
    fn: 'The switching station. Receives raw events from the page, applies rules (triggers), and decides which destinations get which payload.',
    flow: [
      ['triggers', 'when a tag should fire'],
      ['variables', 'dynamic values from the page'],
      ['tags', 'GA4, Ads, Pixel, etc.'],
      ['data layer', 'shared event bus'],
      ['enhanced conversions', 'hash form PII for Ads/GA4'],
    ],
    takeaway:
      'GTM is not a destination. It is the dispatcher. Without it, every platform needs its own custom code on every page.',
  },
];

export function getStation(id: string | null): StationDatum | null {
  if (!id) return null;
  return STATIONS.find((s) => s.id === id) ?? null;
}
