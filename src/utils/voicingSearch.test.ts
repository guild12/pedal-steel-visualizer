import { describe, it, expect } from 'vitest';
import { findVoicings } from './voicingSearch';
import { E9_PRESET } from '../data/presets';

describe('findVoicings', () => {
  it('finds E major at fret 0 with no pedals on E9', () => {
    const results = findVoicings('E', 'maj', E9_PRESET);
    const openVoicing = results.find(v => v.fret === 0 && v.engagedControls.length === 0);
    expect(openVoicing).toBeDefined();
    expect(openVoicing!.score.completeness).toBeGreaterThan(0.5);
  });

  it('finds A major on E9 (requires pedals A+B)', () => {
    const results = findVoicings('A', 'maj', E9_PRESET);
    const pedalVoicing = results.find(
      v => v.fret === 0 &&
      v.engagedControls.includes('A') &&
      v.engagedControls.includes('B')
    );
    expect(pedalVoicing).toBeDefined();
  });

  it('returns results sorted by score (best first)', () => {
    const results = findVoicings('E', 'maj', E9_PRESET);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score.combined).toBeGreaterThanOrEqual(results[i].score.combined);
    }
  });

  it('only searches frets 0-11', () => {
    const results = findVoicings('C', 'maj', E9_PRESET);
    for (const v of results) {
      expect(v.fret).toBeLessThan(12);
    }
  });

  it('each voicing note includes chord function', () => {
    const results = findVoicings('E', 'maj', E9_PRESET);
    const voicing = results[0];
    const chordToneNotes = voicing.notes.filter(n => n.chordFunction !== null);
    expect(chordToneNotes.length).toBeGreaterThan(0);
    const functions = chordToneNotes.map(n => n.chordFunction);
    expect(functions).toContain('root');
  });

  it('marks altered notes correctly', () => {
    const results = findVoicings('A', 'maj', E9_PRESET);
    const pedalVoicing = results.find(
      v => v.engagedControls.length > 0
    );
    if (pedalVoicing) {
      const altered = pedalVoicing.notes.filter(n => n.isAlteredByControl);
      expect(altered.length).toBeGreaterThan(0);
      for (const n of altered) {
        expect(n.alteredBy).not.toBeNull();
      }
    }
  });

  it('respects physical constraints (no non-adjacent pedal pairs)', () => {
    const results = findVoicings('C', 'maj', E9_PRESET);
    for (const v of results) {
      const pedalIndices = v.engagedControls
        .filter(c => E9_PRESET.pedals.includes(c))
        .map(c => E9_PRESET.pedals.indexOf(c));
      if (pedalIndices.length === 2) {
        expect(Math.abs(pedalIndices[0] - pedalIndices[1])).toBe(1);
      }
      expect(pedalIndices.length).toBeLessThanOrEqual(2);
    }
  });
});
