// src/utils/chordDictionary.ts
import type { ChordDefinition } from '../types/chordTypes';

export const CHORD_DICTIONARY: ChordDefinition[] = [
  // Triads
  { quality: 'maj', intervals: [0, 4, 7] },
  { quality: 'min', intervals: [0, 3, 7] },
  { quality: 'dim', intervals: [0, 3, 6] },
  { quality: 'aug', intervals: [0, 4, 8] },
  // Suspended
  { quality: 'sus2', intervals: [0, 2, 7] },
  { quality: 'sus4', intervals: [0, 5, 7] },
  // Sixths
  { quality: '6', intervals: [0, 4, 7, 9] },
  { quality: 'min6', intervals: [0, 3, 7, 9] },
  // Sevenths
  { quality: '7', intervals: [0, 4, 7, 10] },
  { quality: 'maj7', intervals: [0, 4, 7, 11] },
  { quality: 'min7', intervals: [0, 3, 7, 10] },
  { quality: 'dim7', intervals: [0, 3, 6, 9] },
  { quality: 'm7b5', intervals: [0, 3, 6, 10] },
  { quality: 'aug7', intervals: [0, 4, 8, 10] },
  { quality: '7sus4', intervals: [0, 5, 7, 10] },
  // Ninths
  { quality: '9', intervals: [0, 4, 7, 10, 14] },
  { quality: 'maj9', intervals: [0, 4, 7, 11, 14] },
  { quality: 'min9', intervals: [0, 3, 7, 10, 14] },
  { quality: 'add9', intervals: [0, 4, 7, 14] },
  // Elevenths & Thirteenths
  { quality: '11', intervals: [0, 4, 7, 10, 14, 17] },
  { quality: '13', intervals: [0, 4, 7, 10, 14, 21] },
  // Altered
  { quality: '7#9', intervals: [0, 4, 7, 10, 15] },
  { quality: '7b9', intervals: [0, 4, 7, 10, 13] },
  { quality: '7#11', intervals: [0, 4, 7, 10, 18] },
  { quality: 'maj7#11', intervals: [0, 4, 7, 11, 18] },
  // Altered fifths (the b5/#5 is a chord tone, not an extension)
  { quality: '7b5', intervals: [0, 4, 6, 10] },
  { quality: 'maj7b5', intervals: [0, 4, 6, 11] },
  { quality: 'maj7#5', intervals: [0, 4, 8, 11] },
];

/** Map from interval (semitones from root, mod 12) to chord function label */
export const INTERVAL_TO_FUNCTION: Record<number, string> = {
  0: 'root',
  1: 'b9',
  2: '9',
  3: 'b3',
  4: '3rd',
  5: '4th',
  6: 'b5',
  7: '5th',
  8: '#5',
  9: '6th',
  10: 'b7',
  11: '7th',
};

/**
 * Get the chord function label for a note relative to a root.
 * For extended intervals (>12), maps to the extension name.
 */
export function getIntervalLabel(semitones: number): string {
  const extended: Record<number, string> = {
    13: 'b9',
    14: '9',
    15: '#9',
    17: '11',
    18: '#11',
    21: '13',
  };
  if (semitones > 12 && extended[semitones]) {
    return extended[semitones];
  }
  return INTERVAL_TO_FUNCTION[semitones % 12] ?? `?${semitones}`;
}
