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
    id: 'website',
    name: 'Website',
    tag: 'EVENT SOURCE',
    accent: COLORS.cyan,
    category: 'origin',
    categoryLabel: CATEGORY_LABEL.origin,
    position: [-9, 0, 4],
    scale: 1.4,
    fn: 'Where it all begins. A user loads a page, clicks a button, submits a form. Each action is a data event waiting to be sent.',
    flow: [
      ['page_view', 'every page load'],
      ['click', 'CTAs, links'],
      ['form_submit', 'lead, contact'],
      ['purchase', 'checkout'],
    ],
    takeaway:
      'The browser is the origin. Nothing happens downstream unless an event fires here first.',
  },
  {
    id: 'consent',
    name: 'Consent Mode',
    tag: 'GATE · v2',
    accent: COLORS.amber,
    category: 'connector',
    categoryLabel: CATEGORY_LABEL.connector,
    position: [-4.5, 0, 1.8],
    scale: 1.0,
    fn: "A regulatory checkpoint. Reads the user's cookie banner choice and tells every downstream platform whether it can use the data for ads, analytics, or personalization.",
    flow: [
      ['ad_storage', 'granted / denied'],
      ['analytics_storage', 'granted / denied'],
      ['ad_user_data', 'granted / denied'],
      ['ad_personalization', 'granted / denied'],
    ],
    takeaway:
      'When consent is denied, data still flows but it is anonymized. Nothing is silently dropped.',
  },
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
  {
    id: 'gads',
    name: 'Google Ads',
    tag: 'AD PLATFORM · HYBRID',
    accent: COLORS.cyan,
    category: 'hybrid',
    categoryLabel: CATEGORY_LABEL.hybrid,
    position: [9, 0, -1.5],
    scale: 1.2,
    fn: 'Receives conversion signals so it can optimize bidding, build audiences, and report ROAS in the Ads UI. Often imports from GA4 instead of receiving directly. Also contributes click IDs and audience signals back into the system.',
    flow: [
      ['conversion', 'value + currency'],
      ['gclid', 'click identifier'],
      ['enhanced conversions', 'hashed PII'],
      ['audience_signal', 'returned to GTM'],
    ],
    takeaway:
      'Ads platforms need conversion data to bid smartly. Better data in means lower CPA out — and the gclid flowing back closes the loop.',
  },
  {
    id: 'ga4',
    name: 'GA4',
    tag: 'ANALYTICS',
    accent: COLORS.cyan,
    category: 'observatory',
    categoryLabel: CATEGORY_LABEL.observatory,
    position: [5.5, 0, -6],
    scale: 1.0,
    fn: 'Google Analytics 4. The default behavioral analytics destination. Stores every event with its parameters so you can query sessions, funnels, and audiences later.',
    flow: [
      ['events', 'event_name + params'],
      ['user_id', 'cross-device stitch'],
      ['session_id', 'visit grouping'],
      ['conversions', 'flagged events'],
    ],
    takeaway:
      'GA4 is for understanding behavior. It is not the source of truth for ad performance.',
  },
];

export function getStation(id: string | null): StationDatum | null {
  if (!id) return null;
  return STATIONS.find((s) => s.id === id) ?? null;
}
