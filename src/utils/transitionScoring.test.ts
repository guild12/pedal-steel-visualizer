import { describe, it, expect } from 'vitest';
import { findTransitions, scoreMove } from './transitionScoring';
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

describe('scoreMove', () => {
  it('scores a zero-bar-move pedal press (the "just press A" case)', () => {
    const from = { fret: 3, engagedControls: [], notes: [{ pitchClass: 'E' }, { pitchClass: 'B' }] };
    const to = { fret: 3, engagedControls: ['A'], notes: [{ pitchClass: 'E' }, { pitchClass: 'C#' }] };
    const effort = scoreMove(from, to);
    expect(effort.fretDistance).toBe(0);
    expect(effort.controlChanges).toEqual([{ control: 'A', action: 'press' }]);
    expect(effort.commonTones).toBe(1); // E matches by string index; B vs C# does not
    expect(effort.totalScore).toBe(3); // 0*10 + 1*5 - 1*2
  });

  it('counts bar distance and releases', () => {
    const from = { fret: 1, engagedControls: ['A', 'B'], notes: [{ pitchClass: 'F' }] };
    const to = { fret: 6, engagedControls: ['A'], notes: [{ pitchClass: 'A#' }] };
    const effort = scoreMove(from, to);
    expect(effort.fretDistance).toBe(5);
    expect(effort.controlChanges).toEqual([{ control: 'B', action: 'release' }]);
    expect(effort.commonTones).toBe(0);
    expect(effort.totalScore).toBe(55); // 5*10 + 1*5 - 0
  });
});
