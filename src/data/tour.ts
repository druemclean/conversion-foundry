export type TourStop = {
  id: string;
  narrative: string;
};

/**
 * Walks one event from origin to attribution. Order matters: it traces a
 * single conversion's life, not just visits each station.
 */
export const TOUR_STOPS: TourStop[] = [
  {
    id: 'website',
    narrative: 'A user clicks. The browser fires page_view, form_submit, purchase — raw events with no destination yet.',
  },
  {
    id: 'consent',
    narrative: 'Consent Mode tags every event with the user\'s permissions. Denied? The data still flows, anonymized.',
  },
  {
    id: 'gtm',
    narrative: 'GTM is the dispatcher. Triggers decide which destinations get which payload, and shapes the event for each one.',
  },
  {
    id: 'ga4',
    narrative: 'GA4 receives a fan-out: every event for behavioral analysis, plus the ones flagged as conversions.',
  },
  {
    id: 'gads',
    narrative: 'Google Ads gets the conversion + gclid for bidding. A click ID flows back the other way to close the loop.',
  },
  {
    id: 'pixel',
    narrative: 'Meta Pixel sees the event in the browser. fbp/fbc cookies ride back so future events can be deduped.',
  },
  {
    id: 'capi',
    narrative: 'CAPI sends the same event server-side with hashed PII. event_id matches the Pixel send so Meta dedupes.',
  },
  {
    id: 'attribution',
    narrative: 'The lens. Every channel\'s contribution is weighed and credited based on the chosen attribution model.',
  },
];

export const TOUR_AUTO_ADVANCE_MS = 5200;
