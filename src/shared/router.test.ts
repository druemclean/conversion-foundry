import { describe, expect, it } from 'vitest';
import { parseRoute } from './router';

describe('parseRoute', () => {
  it('defaults to the foundry when there is no hash', () => {
    expect(parseRoute('')).toBe('foundry');
    expect(parseRoute('#')).toBe('foundry');
  });

  it('recognises the waterworks with or without a leading slash', () => {
    expect(parseRoute('#/waterworks')).toBe('waterworks');
    expect(parseRoute('#waterworks')).toBe('waterworks');
  });

  it('is case-insensitive', () => {
    expect(parseRoute('#/WATERWORKS')).toBe('waterworks');
  });

  it('ignores a query string on the hash', () => {
    expect(parseRoute('#/waterworks?cam=1,2,3')).toBe('waterworks');
  });

  it('falls back to the foundry for unknown routes', () => {
    expect(parseRoute('#/nope')).toBe('foundry');
    expect(parseRoute('#/foundry')).toBe('foundry');
  });
});
