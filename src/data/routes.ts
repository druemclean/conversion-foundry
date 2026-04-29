import { COLORS } from './stations';

export type RouteStyle = 'default' | 'import' | 'manual' | 'alternative';

export type RouteDatum = {
  id: string;
  from: string;
  to: string;
  color: string;
  /** Relative capsule frequency. 0 disables capsules entirely. */
  density: number;
  /** Hero capsule cycles through these labels. Empty = no hero. */
  events: string[];
  style: RouteStyle;
  /** Hybrid platforms (gads, pixel) send data back. Renders dimmer reverse capsules. */
  returnFlow?: boolean;
  returnEvents?: string[];
};

export const ROUTES: RouteDatum[] = [
  // --- Browser path (primary, prominent) ---
  {
    id: 'web-consent',
    from: 'website',
    to: 'consent',
    color: COLORS.cyan,
    density: 1.4,
    events: ['page_view', 'session_start', 'phone_click', 'form_submit', 'scroll', 'video_play', 'purchase'],
    style: 'default',
  },
  {
    id: 'consent-gtm',
    from: 'consent',
    to: 'gtm',
    color: COLORS.cyan,
    density: 1.4,
    events: ['page_view +consent', 'form_submit +consent', 'purchase +consent'],
    style: 'default',
  },
  {
    id: 'gtm-ga4',
    from: 'gtm',
    to: 'ga4',
    color: COLORS.cyan,
    density: 1.0,
    events: ['page_view', 'generate_lead', 'purchase', 'user_id', 'session_id'],
    style: 'default',
  },
  {
    id: 'gtm-gads',
    from: 'gtm',
    to: 'gads',
    color: COLORS.cyan,
    density: 1.0,
    events: ['conversion', 'enhanced_conversion {em,ph}', 'gclid_capture'],
    style: 'default',
    returnFlow: true,
    returnEvents: ['gclid_back', 'audience_segment'],
  },
  {
    id: 'gtm-pixel',
    from: 'gtm',
    to: 'pixel',
    color: COLORS.magenta,
    density: 1.0,
    events: ['PageView', 'Lead', 'Purchase', 'ViewContent', 'InitiateCheckout'],
    style: 'default',
    returnFlow: true,
    returnEvents: ['fbp', 'fbc', 'cookie_read'],
  },

  // --- GA4 import path (the "GA4 events become Ads conversions" route) ---
  {
    id: 'ga4-gads',
    from: 'ga4',
    to: 'gads',
    color: COLORS.cyan,
    density: 0.5,
    events: ['imported_conversion', 'audience_signal'],
    style: 'import',
  },

  // --- Offline path (Zapier primary) ---
  {
    id: 'crm-zapier',
    from: 'crm',
    to: 'zapier',
    color: COLORS.green,
    density: 0.9,
    events: ['lead_created', 'lead_qualified', 'opportunity_won', 'refund_issued'],
    style: 'default',
  },
  {
    id: 'zapier-gads',
    from: 'zapier',
    to: 'gads',
    color: COLORS.cyan,
    density: 0.7,
    events: ['offline_conversion {gclid,value}'],
    style: 'default',
  },
  {
    id: 'zapier-capi',
    from: 'zapier',
    to: 'capi',
    color: COLORS.magenta,
    density: 0.7,
    events: ['Lead {em,ph,event_id}', 'Purchase {em,ph,event_id}'],
    style: 'default',
  },

  // --- Offline path (file upload, dimmer, manual cadence) ---
  {
    id: 'fileupload-gads',
    from: 'fileupload',
    to: 'gads',
    color: COLORS.cyan,
    density: 0.4,
    events: ['offline_conversion_bulk'],
    style: 'manual',
  },
  {
    id: 'fileupload-capi',
    from: 'fileupload',
    to: 'capi',
    color: COLORS.magenta,
    density: 0.4,
    events: ['bulk_event_upload'],
    style: 'manual',
  },

  // --- Alternative path (sGTM, dashed/ghosted, no capsules) ---
  {
    id: 'gtm-sgtm',
    from: 'gtm',
    to: 'sgtm',
    color: '#ffffff',
    density: 0,
    events: [],
    style: 'alternative',
  },
  {
    id: 'sgtm-capi',
    from: 'sgtm',
    to: 'capi',
    color: '#ffffff',
    density: 0,
    events: [],
    style: 'alternative',
  },
  {
    id: 'sgtm-gads',
    from: 'sgtm',
    to: 'gads',
    color: '#ffffff',
    density: 0,
    events: [],
    style: 'alternative',
  },

  // --- Convergence to attribution ---
  {
    id: 'ga4-attr',
    from: 'ga4',
    to: 'attribution',
    color: COLORS.cyan,
    density: 0.5,
    events: ['session_data'],
    style: 'default',
  },
  {
    id: 'gads-attr',
    from: 'gads',
    to: 'attribution',
    color: COLORS.cyan,
    density: 0.5,
    events: ['conversion_value', 'attribution_credit'],
    style: 'default',
  },
  {
    id: 'pixel-attr',
    from: 'pixel',
    to: 'attribution',
    color: COLORS.magenta,
    density: 0.5,
    events: ['attributed_conversion'],
    style: 'default',
  },
  {
    id: 'capi-attr',
    from: 'capi',
    to: 'attribution',
    color: COLORS.magenta,
    density: 0.5,
    events: ['matched_conversion'],
    style: 'default',
  },
];

/**
 * Connection point per station — where routes exit/enter visually.
 * Local Y offset above the station's base position.
 */
export const CONNECTOR_HEIGHT: Record<string, number> = {
  website: 1.55,
  consent: 1.85,
  gtm: 1.45,
  gads: 1.55,
  pixel: 1.45,
  ga4: 0.7,
  crm: 1.0,
  zapier: 1.0,
  sgtm: 1.0,
  capi: 1.15,
  fileupload: 0.95,
  attribution: 0,
};
