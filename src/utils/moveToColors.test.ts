import { describe, it, expect } from 'vitest';
import { bucketEase, easeColor } from './moveToColors';

describe('bucketEase', () => {
  it('buckets by totalScore thresholds', () => {
    expect(bucketEase(-2)).toBe('easy');
    expect(bucketEase(5)).toBe('easy');
    expect(bucketEase(6)).toBe('medium');
    expect(bucketEase(20)).toBe('medium');
    expect(bucketEase(21)).toBe('hard');
    expect(bucketEase(99)).toBe('hard');
  });
});

describe('easeColor', () => {
  it('maps buckets to the ease palette', () => {
    expect(easeColor('easy')).toBe('#7CFF6B');
    expect(easeColor('medium')).toBe('#FFB454');
    expect(easeColor('hard')).toBe('#FF6B6B');
  });
});
