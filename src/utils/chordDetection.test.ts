import { describe, it, expect } from 'vitest';
import { detectChord, parseChordName, parseExtension, getExtensions } from './chordDetection';

// Pitch-class numbers: C=0 C#=1 D=2 D#=3 E=4 F=5 F#=6 G=7 G#=8 A=9 A#=10 B=11

describe('detectChord', () => {
  it('detects a C major triad', () => {
    const result = detectChord(['C', 'E', 'G']);
    expect(result.primary.root).toBe('C');
    expect(result.primary.quality).toBe('maj');
    expect(result.primary.display).toBe('Cmaj');
  });

  it('detects an A minor triad', () => {
    const result = detectChord(['A', 'C', 'E']);
    expect(result.primary.root).toBe('A');
    expect(result.primary.quality).toBe('min');
  });

  it('detects a G7 chord', () => {
    const result = detectChord(['G', 'B', 'D', 'F']);
    expect(result.primary.root).toBe('G');
    expect(result.primary.quality).toBe('7');
  });

  it('detects Cmaj7 with extensions', () => {
    const result = detectChord(['C', 'E', 'G', 'B', 'D', 'F#']);
    expect(result.primary.quality).toBe('maj7');
    expect(result.primary.root).toBe('C');
    expect(result.layers.extensions.length).toBeGreaterThan(0);
  });

  it('provides alternative interpretations', () => {
    const result = detectChord(['C', 'E', 'G', 'B']);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  it('handles incomplete chord (missing 5th)', () => {
    const result = detectChord(['C', 'E', 'B']);
    expect(result.primary.root).toBe('C');
    expect(result.primary.quality).toBe('maj7');
  });

  it('returns null primary for single note', () => {
    const result = detectChord(['C']);
    expect(result.primary.display).toBe('C');
    expect(result.primary.quality).toBe('');
  });

  it('handles two notes as interval', () => {
    const result = detectChord(['C', 'E']);
    expect(result.primary.root).toBe('C');
  });

  it('detects chord regardless of note order', () => {
    const result = detectChord(['G', 'C', 'E']);
    expect(result.primary.root).toBe('C');
    expect(result.primary.quality).toBe('maj');
  });

  it('detects diminished chord', () => {
    const result = detectChord(['B', 'D', 'F']);
    expect(result.primary.root).toBe('B');
    expect(result.primary.quality).toBe('dim');
  });

  it('handles duplicate pitch classes', () => {
    const result = detectChord(['C', 'E', 'G', 'C', 'E']);
    expect(result.primary.root).toBe('C');
    expect(result.primary.quality).toBe('maj');
  });

  it('detects sus4 chord', () => {
    const result = detectChord(['C', 'F', 'G']);
    expect(result.primary.root).toBe('C');
    expect(result.primary.quality).toBe('sus4');
  });
});

describe('parseChordName', () => {
  it('parses simple major chord', () => {
    const result = parseChordName('Cmaj');
    expect(result).toEqual({ root: 'C', quality: 'maj' });
  });

  it('parses sharp root', () => {
    const result = parseChordName('F#min7');
    expect(result).toEqual({ root: 'F#', quality: 'min7' });
  });

  it('parses dominant 7', () => {
    const result = parseChordName('G7');
    expect(result).toEqual({ root: 'G', quality: '7' });
  });

  it('parses complex chord', () => {
    const result = parseChordName('Cmaj9');
    expect(result).toEqual({ root: 'C', quality: 'maj9' });
  });

  it('parses flat root as sharp equivalent', () => {
    const result = parseChordName('Bbmaj7');
    expect(result).toEqual({ root: 'A#', quality: 'maj7' });
  });

  it('parses just a root note as major', () => {
    const result = parseChordName('C');
    expect(result).toEqual({ root: 'C', quality: 'maj' });
  });

  it('parses m as min shorthand', () => {
    const result = parseChordName('Am');
    expect(result).toEqual({ root: 'A', quality: 'min' });
  });

  it('returns null for invalid input', () => {
    expect(parseChordName('')).toBeNull();
    expect(parseChordName('xyz')).toBeNull();
  });
});

describe('parseExtension', () => {
  it('parses ordinal labels (the previously-broken case)', () => {
    expect(parseExtension('4th (G)')).toEqual({ label: '4th', note: 'G' });
    expect(parseExtension('6th (A)')).toEqual({ label: '6th', note: 'A' });
  });

  it('parses numeric and altered labels', () => {
    expect(parseExtension('9 (D)')).toEqual({ label: '9', note: 'D' });
    expect(parseExtension('b9 (F)')).toEqual({ label: 'b9', note: 'F' });
    expect(parseExtension('#11 (A#)')).toEqual({ label: '#11', note: 'A#' });
  });

  it('returns null for malformed input', () => {
    expect(parseExtension('garbage')).toBeNull();
    expect(parseExtension('')).toBeNull();
  });
});

describe('getExtensions altered-tension relabeling', () => {
  it('relabels b5 over a perfect 5th as #11 (E7 + Bb, keeps natural B)', () => {
    // E G# B D + Bb
    const { extensions } = getExtensions('E', '7', [4, 8, 11, 2, 10]);
    expect(extensions).toContain('#11 (A#)');
    expect(extensions.some(e => e.startsWith('b5'))).toBe(false);
  });

  it('relabels b3 over a natural 3rd as #9 (E7 + G)', () => {
    // E G# B D + G
    const { extensions } = getExtensions('E', '7', [4, 8, 11, 2, 7]);
    expect(extensions).toContain('#9 (G)');
  });

  it('relabels #5 over a perfect 5th as b13 (E7 + C)', () => {
    // E G# B D + C
    const { extensions } = getExtensions('E', '7', [4, 8, 11, 2, 0]);
    expect(extensions).toContain('b13 (C)');
  });

  it('does not list the b5 as an extension when it is a chord tone (E7b5)', () => {
    // E G# Bb D — b5 is part of the 7b5 quality
    const { extensions } = getExtensions('E', '7b5', [4, 8, 10, 2]);
    expect(extensions).toEqual([]);
  });

  it('relabels a raised 4th over a major triad as #11 on any chord (Cmaj + F#)', () => {
    // C E G + F#
    const { extensions } = getExtensions('C', 'maj', [0, 4, 7, 6]);
    expect(extensions).toContain('#11 (F#)');
  });

  it('hides a natural 3 over a minor 3 (no standard tension name)', () => {
    // E G B (Emin) + G#
    const { extensions } = getExtensions('E', 'min', [4, 7, 11, 8]);
    expect(extensions).toEqual([]);
  });
});
