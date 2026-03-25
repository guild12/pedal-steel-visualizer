import { describe, it, expect } from 'vitest';
import { generateValidCombinations } from './controlConstraints';

describe('generateValidCombinations', () => {
  it('includes empty combination (no controls)', () => {
    const combos = generateValidCombinations(['A', 'B', 'C'], ['LKL', 'LKR'], ['RKL', 'RKR']);
    expect(combos).toContainEqual([]);
  });

  it('includes single pedal combinations', () => {
    const combos = generateValidCombinations(['A', 'B', 'C'], [], []);
    expect(combos).toContainEqual(['A']);
    expect(combos).toContainEqual(['B']);
    expect(combos).toContainEqual(['C']);
  });

  it('includes adjacent pedal pairs only', () => {
    const combos = generateValidCombinations(['A', 'B', 'C'], [], []);
    expect(combos).toContainEqual(['A', 'B']);
    expect(combos).toContainEqual(['B', 'C']);
    expect(combos).not.toContainEqual(['A', 'C']);
  });

  it('does not combine two left knee levers', () => {
    const combos = generateValidCombinations([], ['LKL', 'LKR'], []);
    expect(combos).not.toContainEqual(expect.arrayContaining(['LKL', 'LKR']));
  });

  it('allows one left + one right knee lever', () => {
    const combos = generateValidCombinations([], ['LKL'], ['RKL']);
    expect(combos).toContainEqual(expect.arrayContaining(['LKL', 'RKL']));
  });

  it('combines pedals with knee levers', () => {
    const combos = generateValidCombinations(['A', 'B'], ['LKL'], ['RKL']);
    expect(combos).toContainEqual(expect.arrayContaining(['A', 'LKL']));
    expect(combos).toContainEqual(expect.arrayContaining(['A', 'B', 'LKL', 'RKL']));
  });

  it('never exceeds 2 pedals + 1 left + 1 right', () => {
    const combos = generateValidCombinations(
      ['A', 'B', 'C', 'D', 'E'],
      ['LKL', 'LKR', 'LKR2'],
      ['RKL', 'RKR', 'RKR2']
    );
    for (const combo of combos) {
      const pedalCount = combo.filter(c => ['A', 'B', 'C', 'D', 'E'].includes(c)).length;
      const leftCount = combo.filter(c => ['LKL', 'LKR', 'LKR2'].includes(c)).length;
      const rightCount = combo.filter(c => ['RKL', 'RKR', 'RKR2'].includes(c)).length;
      expect(pedalCount).toBeLessThanOrEqual(2);
      expect(leftCount).toBeLessThanOrEqual(1);
      expect(rightCount).toBeLessThanOrEqual(1);
    }
  });
});
