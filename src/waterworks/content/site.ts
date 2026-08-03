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
