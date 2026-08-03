import { describe, expect, it } from 'vitest';
import { validateClientSite } from './site';
import { DENTIST } from './dentist';

describe('validateClientSite', () => {
  it('accepts the dentist fixture', () => {
    expect(validateClientSite(DENTIST)).toEqual([]);
  });

  it('rejects an offlineShare outside 0..1', () => {
    const bad = { ...DENTIST, offlineShare: 1.4 };
    expect(validateClientSite(bad)).toContain('offlineShare must be between 0 and 1');
  });

  it('rejects a non-positive monthlyVolume', () => {
    const bad = { ...DENTIST, monthlyVolume: 0 };
    expect(validateClientSite(bad)).toContain('monthlyVolume must be greater than 0');
  });

  it('rejects an empty conversion list', () => {
    const bad = { ...DENTIST, conversions: [] };
    expect(validateClientSite(bad)).toContain('conversions must not be empty');
  });

  it('rejects an empty discovery list', () => {
    const bad = { ...DENTIST, discovery: [] };
    expect(validateClientSite(bad)).toContain('discovery must not be empty');
  });

  it('rejects a conversion weight outside 0..1', () => {
    const bad = { ...DENTIST, conversions: [{ kind: 'phone' as const, weight: 2 }] };
    expect(validateClientSite(bad)).toContain('conversion weights must be between 0 and 1');
  });
});

describe('DENTIST', () => {
  it('is a phone-led business, which is the whole point of the scenario', () => {
    const phone = DENTIST.conversions.find((c) => c.kind === 'phone');
    expect(phone).toBeDefined();
    const heaviest = DENTIST.conversions.reduce((a, b) => (b.weight > a.weight ? b : a));
    expect(heaviest.kind).toBe('phone');
  });

  it('has a majority-offline tail', () => {
    expect(DENTIST.offlineShare).toBeGreaterThan(0.5);
  });
});
