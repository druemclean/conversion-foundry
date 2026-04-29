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
  /** Renders the station with reduced emissives + transparent shell. Used for sGTM. */
  alternative?: boolean;
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
    id: 'pixel',
    name: 'Meta Pixel',
    tag: 'AD PLATFORM · HYBRID',
    accent: COLORS.magenta,
    category: 'hybrid',
    categoryLabel: CATEGORY_LABEL.hybrid,
    position: [-2, 0, -6.5],
    scale: 1.2,
    fn: "Meta's browser-side tag. Fires standard events (PageView, Lead, Purchase) for Facebook and Instagram ad attribution and audience building. Also returns fbp/fbc cookies that ride along on outbound events.",
    flow: [
      ['fbp', 'browser cookie'],
      ['fbc', 'click cookie, returned'],
      ['event_id', 'dedupe key'],
      ['custom_data', 'value, content_ids'],
    ],
    takeaway:
      'Browser-only tracking is increasingly blocked by browsers and extensions. The pixel alone is not enough anymore.',
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

  // Mid level
  {
    id: 'crm',
    name: 'CRM / Offline',
    tag: 'OFFLINE SOURCE',
    accent: COLORS.green,
    category: 'origin',
    categoryLabel: CATEGORY_LABEL.origin,
    position: [-10, 4, -3],
    scale: 1.0,
    fn: 'Your CRM, sales database, or call tracker. The events that happen after the click but before the purchase, or entirely outside the browser. Closed deals, qualified leads, refunds.',
    flow: [
      ['lead → MQL', 'CRM update'],
      ['lead → SQL', 'sales action'],
      ['closed-won', 'final outcome'],
      ['refund', 'negative signal'],
    ],
    takeaway:
      'Most ad platforms do not learn what is a good lead unless you tell them. Offline conversions close that loop.',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    tag: 'CRM ROUTER',
    accent: COLORS.green,
    category: 'connector',
    categoryLabel: CATEGORY_LABEL.connector,
    position: [-3, 4, -4],
    scale: 1.1,
    fn: 'A no-code automation platform. Listens for CRM events (closed deals, qualified leads, refunds) and forwards them to ad platforms as offline conversions. The OpGo default for closing the loop on conversions that happen after the click.',
    flow: [
      ['trigger', 'CRM webhook or scheduled poll'],
      ['transform', 'shape payload, hash PII'],
      ['action', 'send to Google Ads, Meta CAPI, etc.'],
    ],
    takeaway:
      'Zapier is the practical alternative to building your own server-side pipeline. Slower and more limited than sGTM, but takes 20 minutes to set up instead of 20 hours.',
  },
  {
    id: 'sgtm',
    name: 'Server-side GTM',
    tag: 'ALT · NOT IN USE',
    accent: COLORS.green,
    category: 'connector',
    categoryLabel: CATEGORY_LABEL.connector,
    position: [-3.5, 4, -7],
    scale: 1.0,
    alternative: true,
    fn: 'An alternative routing layer that runs on your own server instead of Zapier. Receives events from the browser, enriches them, and forwards to ad platforms. More reliable and private, but a significant lift to set up. OpGo doesn\'t currently use this, but it\'s the direction the industry is moving.',
    flow: [
      ['enrichment', 'add server data'],
      ['transformations', 'reshape payload'],
      ['CAPI dispatch', 'Meta, TikTok, etc.'],
    ],
    takeaway:
      'An alternative routing layer that runs on your own server. More reliable and private than Zapier, but a significant lift to set up. Worth knowing exists; not what OpGo currently uses.',
  },
  {
    id: 'capi',
    name: 'Meta CAPI',
    tag: 'CONVERSION API · HYBRID',
    accent: COLORS.magenta,
    category: 'hybrid',
    categoryLabel: CATEGORY_LABEL.hybrid,
    position: [5, 4, -7],
    scale: 1.2,
    fn: "Meta's Conversions API. The server-side complement to the Pixel. Sends conversion events directly from your server to Meta with hashed customer data for better matching.",
    flow: [
      ['em', 'hashed email'],
      ['ph', 'hashed phone'],
      ['event_id', 'matches Pixel for dedupe'],
      ['action_source', 'website / system_generated'],
    ],
    takeaway:
      'Pixel + CAPI together is the modern Meta setup. Same event sent both ways, deduped by event_id.',
  },

  // Origin (smaller, behind CRM)
  {
    id: 'fileupload',
    name: 'File Upload',
    tag: 'MANUAL · OCCASIONAL',
    accent: COLORS.green,
    category: 'origin',
    categoryLabel: CATEGORY_LABEL.origin,
    position: [-13, 0.5, -2],
    scale: 0.85,
    fn: 'A CSV of conversions uploaded directly to Google Ads or Meta. Used when neither GTM nor an automated CRM connection is available, or for retroactive backfills.',
    flow: [
      ['gclid', 'click identifier (Google)'],
      ['email_hash', 'matching key (Meta)'],
      ['conversion_time', 'when it happened'],
      ['conversion_value', 'revenue or score'],
    ],
    takeaway:
      'The fallback option. Manual but powerful. Best for one-off imports, fixing gaps in tracking, or platforms with no automated connection.',
  },

  // Summit
  {
    id: 'attribution',
    name: 'Attribution Model',
    tag: 'ANALYTICS',
    accent: COLORS.cyan,
    category: 'observatory',
    categoryLabel: CATEGORY_LABEL.observatory,
    position: [2, 8, -3],
    scale: 1.0,
    fn: 'The lens applied to all this data. Decides which touchpoint gets credit for a conversion when a user interacts with multiple channels.',
    flow: [
      ['last click', 'simple, default'],
      ['data-driven', 'ML-weighted'],
      ['position-based', 'first/last weighted'],
      ['linear', 'equal credit'],
    ],
    takeaway:
      'Attribution is a choice, not a fact. The same conversion can be credited completely differently depending on the model.',
  },
];

export function getStation(id: string | null): StationDatum | null {
  if (!id) return null;
  return STATIONS.find((s) => s.id === id) ?? null;
}
