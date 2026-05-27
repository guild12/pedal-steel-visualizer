import { NOTE_NAMES, normalizeNoteName } from './noteUtils';
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
      const chordIntervalsMod12 = chord.intervals.map((iv: number) => iv % 12);
      const matchedIntervals = chordIntervalsMod12.filter((ci: number) => intervals.includes(ci));
      const matchCount = matchedIntervals.length;

      if (matchCount < 2) continue; // Need at least 2 matching intervals

      const hasRoot = intervals.includes(0);
      const totalChordTones = chordIntervalsMod12.length;
      const extraNotes = intervals.filter((iv: number) => !chordIntervalsMod12.includes(iv)).length;

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
  const { extensions } = getExtensions(primary.root, primary.quality, pitchClasses);
  return { core: primary.display, extensions };
}

/**
 * Compute extension tones for any chord against a set of pitch classes.
 * Returns extensions as formatted strings like "9 (D)", "b5 (G#)".
 */
export function getExtensions(root: string, quality: string, pitchClasses: number[]): { extensions: string[] } {
  const rootSemitone = noteNameToSemitone(root);
  const intervals = pitchClasses
    .map(pc => (pc - rootSemitone + 12) % 12)
    .sort((a, b) => a - b);

  const chordDef = CHORD_DICTIONARY.find(c => c.quality === quality);
  if (!chordDef) {
    return { extensions: [] };
  }

  const chordIntervalsMod12 = chordDef.intervals.map((iv: number) => iv % 12);
  const has = (iv: number) => chordIntervalsMod12.includes(iv);

  // An altered note that coexists with the natural chord tone of the same scale
  // degree is really an upper-structure tension, not a clash. Relabel it (and keep
  // it). The one case with no standard tension name — a natural 3 over a minor 3 —
  // is hidden (returns null). Anything else uses its normal label (undefined).
  const relabelClash = (iv: number): string | null | undefined => {
    if (iv === 3 && has(4)) return '#9';   // b3 over a natural 3rd
    if (iv === 6 && has(7)) return '#11';  // b5 over a perfect 5th
    if (iv === 8 && has(7)) return 'b13';  // #5 over a perfect 5th
    if (iv === 4 && has(3)) return null;   // natural 3 over a minor 3 — no name, hide
    return undefined;                      // not a clash — use normal label
  };

  const extensions: string[] = [];

  for (const interval of intervals) {
    if (chordIntervalsMod12.includes(interval) || interval === 0) continue;
    const relabeled = relabelClash(interval);
    if (relabeled === null) continue; // hidden edge case (maj3 over min3)
    const noteName = NOTE_NAMES[(rootSemitone + interval) % 12];
    const label = relabeled ?? getIntervalLabel(interval);
    extensions.push(`${label} (${noteName})`);
  }

  return { extensions };
}

/**
 * Parse a formatted extension string like "9 (D)", "4th (G)", or "#11 (A#)"
 * into its label and note. Returns null when it doesn't match the format.
 * The label is any non-space token, so ordinal labels (4th, 6th) parse too.
 */
export function parseExtension(ext: string): { label: string; note: string } | null {
  const match = ext.match(/^(\S+)\s+\(([A-G][#b]?)\)/);
  if (!match) return null;
  return { label: match[1], note: match[2] };
}

const QUALITY_ALIASES: Record<string, string> = {
  '': 'maj',
  'M': 'maj',
  'm': 'min',
  'mi': 'min',
  '-': 'min',
  'Δ': 'maj7',
  'Δ7': 'maj7',
  'M7': 'maj7',
  'm7': 'min7',
  'mi7': 'min7',
  '-7': 'min7',
  'ø': 'm7b5',
  'ø7': 'm7b5',
  'o': 'dim',
  'o7': 'dim7',
  '+': 'aug',
  '+7': 'aug7',
  'mM7': 'min7',
};

export function parseChordName(input: string): { root: string; quality: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const rootMatch = trimmed.match(/^([A-G][#b]?)(.*)/);
  if (!rootMatch) return null;

  let root = rootMatch[1];
  let qualityStr = rootMatch[2];

  // Normalize flat roots to sharps
  if (root.includes('b') && root.length === 2) {
    root = normalizeNoteName(root);
  }

  // Verify root is a valid note
  if (!NOTE_NAMES.includes(root as typeof NOTE_NAMES[number])) {
    return null;
  }

  // Resolve quality aliases
  if (QUALITY_ALIASES[qualityStr] !== undefined) {
    qualityStr = QUALITY_ALIASES[qualityStr];
  }

  // Handle 'm' prefix for minor variants (m7, m9, etc.)
  if (qualityStr.startsWith('m') && qualityStr !== 'maj' && !qualityStr.startsWith('maj') && !qualityStr.startsWith('min')) {
    qualityStr = 'min' + qualityStr.slice(1);
  }

  // Verify quality exists in dictionary
  const validQuality = CHORD_DICTIONARY.some(c => c.quality === qualityStr);
  if (!validQuality && qualityStr !== '') {
    return null;
  }

  if (qualityStr === '') qualityStr = 'maj';

  return { root, quality: qualityStr };
}

/**
 * Get the chord tones (as pitch class semitone values 0-11) for a given root + quality.
 */
export function getChordTones(root: string, quality: string): number[] {
  const rootSemitone = noteNameToSemitone(root);
  const chordDef = CHORD_DICTIONARY.find(c => c.quality === quality);
  if (!chordDef) return [rootSemitone];
  return chordDef.intervals.map((iv: number) => (rootSemitone + iv) % 12);
}
