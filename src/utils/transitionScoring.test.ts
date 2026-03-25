import { describe, it, expect } from 'vitest';
import { findTransitions } from './transitionScoring';
import { E9_PRESET } from '../data/presets';

describe('findTransitions', () => {
  it('finds transitions between E and A on E9', () => {
    const results = findTransitions('E', 'maj', 'A', 'maj', E9_PRESET);
    expect(results.length).toBeGreaterThan(0);
  });

  it('ranks same-fret transitions higher', () => {
    const results = findTransitions('E', 'maj', 'A', 'maj', E9_PRESET);
    if (results.length >= 2) {
      expect(results[0].effort.totalScore).toBeLessThanOrEqual(results[1].effort.totalScore);
    }
  });

  it('calculates fret distance correctly', () => {
    const results = findTransitions('E', 'maj', 'A', 'maj', E9_PRESET);
    for (const r of results) {
      expect(r.effort.fretDistance).toBe(Math.abs(r.from.fret - r.to.fret));
    }
  });

  it('lists control changes (press/release)', () => {
    const results = findTransitions('E', 'maj', 'A', 'maj', E9_PRESET);
    const withChanges = results.find(r => r.effort.controlChanges.length > 0);
    if (withChanges) {
      for (const change of withChanges.effort.controlChanges) {
        expect(['press', 'release']).toContain(change.action);
        expect(change.control).toBeTruthy();
      }
    }
  });

  it('returns at most 5 results by default', () => {
    const results = findTransitions('E', 'maj', 'C', 'maj', E9_PRESET);
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
