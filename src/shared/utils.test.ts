import { describe, expect, it } from 'vitest';
import { clamp, generateId } from './utils';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe('generateId', () => {
  it('starts with the given prefix', () => {
    const id = generateId('lobby');
    expect(id.startsWith('lobby_')).toBe(true);
  });

  it('generates unique ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId('test'));
    }
    expect(ids.size).toBe(100);
  });
});
