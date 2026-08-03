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
