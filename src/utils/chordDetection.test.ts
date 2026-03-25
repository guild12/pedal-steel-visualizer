import { describe, it, expect } from 'vitest';
import { detectChord, parseChordName } from './chordDetection';

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
