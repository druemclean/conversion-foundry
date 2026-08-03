import { describe, expect, it } from 'vitest';
import { fbm2D, hash2, valueNoise2D } from './noise';

describe('hash2', () => {
  it('is deterministic', () => {
    expect(hash2(3, 7, 42)).toBe(hash2(3, 7, 42));
  });

  it('stays in [0, 1)', () => {
    for (let x = -50; x < 50; x += 7) {
      for (let y = -50; y < 50; y += 11) {
        const n = hash2(x, y, 1);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
      }
    }
  });

  it('separates neighbouring cells', () => {
    expect(hash2(3, 7, 42)).not.toBe(hash2(4, 7, 42));
    expect(hash2(3, 7, 42)).not.toBe(hash2(3, 8, 42));
  });

  it('separates seeds', () => {
    expect(hash2(3, 7, 42)).not.toBe(hash2(3, 7, 43));
  });
});

describe('valueNoise2D', () => {
  it('equals the lattice hash at integer coordinates', () => {
    expect(valueNoise2D(4, 9, 5)).toBeCloseTo(hash2(4, 9, 5), 10);
  });

  it('is continuous — a small step gives a small change', () => {
    const a = valueNoise2D(2.5, 3.5, 0);
    const b = valueNoise2D(2.501, 3.5, 0);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });

  it('stays in [0, 1]', () => {
    for (let x = 0; x < 20; x += 0.37) {
      const n = valueNoise2D(x, x * 1.7, 3);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
  });
});

describe('fbm2D', () => {
  it('stays in [0, 1]', () => {
    for (let x = 0; x < 30; x += 0.53) {
      const n = fbm2D(x, x * 0.8, 11, 4);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic', () => {
    expect(fbm2D(1.25, 4.5, 9, 5)).toBe(fbm2D(1.25, 4.5, 9, 5));
  });

  it('varies across the domain', () => {
    const samples = new Set<number>();
    for (let x = 0; x < 10; x += 0.9) samples.add(fbm2D(x, 0, 2, 4));
    expect(samples.size).toBeGreaterThan(5);
  });
});
