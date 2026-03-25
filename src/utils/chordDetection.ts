import { NOTE_NAMES } from './noteUtils';
import { CHORD_DICTIONARY, getIntervalLabel } from './chordDictionary';
import type { ChordDetectionResult, ChordName, ChordLayers, ScoredChordName } from '../types/chordTypes';

/**
 * Convert a note name to its semitone index (0-11).
 * C=0, C#=1, D=2, ... B=11
 */
export function noteNameToSemitone(name: string): number {
  const idx = NOTE_NAMES.indexOf(name as typeof NOTE_NAMES[number]);
  if (idx === -1) throw new Error(`Unknown note name: ${name}`);
  return idx;
}

/**
 * Get the pitch classes present in a set of notes as semitone values (0-11).
 * Deduplicates.
 */
function toPitchClassSet(notes: string[]): number[] {
  const set = new Set(notes.map(noteNameToSemitone));
  return Array.from(set);
}

/**
 * Detect the chord from a set of pitch class names.
 * Returns primary interpretation, layered breakdown, and alternatives.
 */
export function detectChord(notes: string[]): ChordDetectionResult {
  const unique = [...new Set(notes)];

  // Single note — no chord
  if (unique.length <= 1) {
    const note = unique[0] ?? '';
    return {
      primary: { root: note, quality: '', display: note },
      layers: { core: note, extensions: [] },
      alternatives: [],
    };
  }

  const pitchClasses = toPitchClassSet(unique);
  const scored: ScoredChordName[] = [];

  // Try every possible root
  for (let rootSemitone = 0; rootSemitone < 12; rootSemitone++) {
    const rootName = NOTE_NAMES[rootSemitone];
    // Compute intervals relative to this root
    const intervals = pitchClasses.map(pc => (pc - rootSemitone + 12) % 12).sort((a, b) => a - b);

    // Try each chord quality
    for (const chord of CHORD_DICTIONARY) {
      const chordIntervalsMod12 = chord.intervals.map(i => i % 12);
      const matchedIntervals = chordIntervalsMod12.filter(ci => intervals.includes(ci));
      const matchCount = matchedIntervals.length;

      if (matchCount < 2) continue; // Need at least 2 matching intervals

      const hasRoot = intervals.includes(0);
      const totalChordTones = chordIntervalsMod12.length;
      const matchRatio = matchCount / totalChordTones;
      const extraNotes = intervals.filter(i => !chordIntervalsMod12.includes(i)).length;

      const missingTones = totalChordTones - matchCount;

      // Scoring philosophy:
      // - "Base chord" label should use at most 4 tones (triads and 7th chords).
      //   Extended chords (9, 11, 13) are penalized heavily so that e.g. Cmaj7 + 9 + #11
      //   is labeled "Cmaj7" with extensions, NOT "Cmaj9" with one extension.
      // - Among base chords (≤4 tones), prefer the one that explains the most input notes
      //   (density). This makes G7 beat Gmaj when all 4 notes of G7 are present.
      // - Missing chord tones (e.g. no 5th) are penalized but the chord can still win if
      //   it's the best explanation.
      const isExtendedChord = chord.intervals.length > 4;
      const inputCount = pitchClasses.length;

      let score = 0;
      if (hasRoot) score += 20;

      if (matchCount === totalChordTones) {
        // All defined chord tones are present in the input.
        score += 80;
        // Density bonus: reward explaining more of the input notes
        score += (matchCount / inputCount) * 40;
        // Extended chords (9th/11th/13th) get a large penalty so 7th chords win
        // when both are complete matches — extended chords only win with exact input match
        if (isExtendedChord) {
          score -= 40; // Extended chord penalty
          if (extraNotes > 0) score -= extraNotes * 20; // Extra harsh for extended + extras
        } else {
          score -= extraNotes * 8;
        }
        score -= chord.intervals.length * 3; // mild simplicity tiebreaker
      } else {
        // Partial match: some chord tones are missing from the input.
        score += (matchCount / inputCount) * 40; // density
        score -= missingTones * 15;              // penalize missing tones
        score -= chord.intervals.length * 3;    // still prefer simpler
        if (isExtendedChord) score -= 20;       // still penalize extended partials
      }

      scored.push({
        root: rootName,
        quality: chord.quality,
        display: `${rootName}${chord.quality}`,
        score,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // No match found
    const noteList = unique.join(', ');
    return {
      primary: { root: unique[0], quality: '', display: noteList },
      layers: { core: noteList, extensions: [] },
      alternatives: [],
    };
  }

  const primary: ChordName = {
    root: scored[0].root,
    quality: scored[0].quality,
    display: scored[0].display,
  };

  const layers = buildLayers(primary, pitchClasses);
  const alternatives = scored.slice(1, 6); // Top 5 alternatives

  return { primary, layers, alternatives };
}

/**
 * Build layered breakdown (core chord + extensions).
 */
function buildLayers(primary: ChordName, pitchClasses: number[]): ChordLayers {
  const rootSemitone = noteNameToSemitone(primary.root);
  const intervals = pitchClasses
    .map(pc => (pc - rootSemitone + 12) % 12)
    .sort((a, b) => a - b);

  // Find the matching chord definition
  const chordDef = CHORD_DICTIONARY.find(c => c.quality === primary.quality);
  if (!chordDef) {
    return { core: primary.display, extensions: [] };
  }

  const chordIntervalsMod12 = chordDef.intervals.map(i => i % 12);
  const extensions: string[] = [];

  for (const interval of intervals) {
    if (!chordIntervalsMod12.includes(interval) && interval !== 0) {
      const noteName = NOTE_NAMES[(rootSemitone + interval) % 12];
      const label = getIntervalLabel(interval);
      extensions.push(`${label} (${noteName})`);
    }
  }

  return { core: primary.display, extensions };
}

/**
 * Get the chord tones (as pitch class semitone values 0-11) for a given root + quality.
 */
export function getChordTones(root: string, quality: string): number[] {
  const rootSemitone = noteNameToSemitone(root);
  const chordDef = CHORD_DICTIONARY.find(c => c.quality === quality);
  if (!chordDef) return [rootSemitone];
  return chordDef.intervals.map(i => (rootSemitone + i) % 12);
}
