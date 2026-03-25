# Chord Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chord detection, chord finding, and chord transition features as interactive overlays on the existing SVG fretboard.

**Architecture:** Pure chord engine utilities (detection, voicing search, transitions) with no UI dependencies, a `useChordState` hook to manage chord-specific state, and new overlay components that integrate with the existing `Fretboard` SVG. All chord state is computed/derived — nothing persists to localStorage.

**Tech Stack:** React 18, TypeScript 5.9, Tailwind CSS 4.2, SVG, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-24-chord-visualization-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/chordTypes.ts` | All chord-related TypeScript interfaces |
| `src/utils/chordDictionary.ts` | Chord interval patterns (data, no logic) |
| `src/utils/chordDetection.ts` | `detectChord()`, `parseChordName()`, `getChordTones()` |
| `src/utils/chordDetection.test.ts` | Unit tests for chord detection |
| `src/utils/controlConstraints.ts` | `generateValidCombinations()` using physical constraints |
| `src/utils/controlConstraints.test.ts` | Unit tests for constraint generation |
| `src/utils/voicingSearch.ts` | `findVoicings()` — searches fret/control combos for a target chord |
| `src/utils/voicingSearch.test.ts` | Unit tests for voicing search |
| `src/utils/transitionScoring.ts` | `findTransitions()` — scores voicing pairs for two chords |
| `src/utils/transitionScoring.test.ts` | Unit tests for transition scoring |
| `src/utils/chordFunctionColors.ts` | Color mapping constants (chord function → hex color) |
| `src/hooks/useChordState.ts` | Chord state management hook |
| `src/hooks/useChordState.test.ts` | Unit tests for chord state hook |
| `src/components/ChordVisualization/ChordAnalyzerBadge.tsx` | Always-on floating chord name badge |
| `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx` | Tests for analyzer badge |
| `src/components/ChordVisualization/ChordDetailPopover.tsx` | Expanded chord breakdown popover |
| `src/components/ChordVisualization/ChordPicker.tsx` | Root + quality grid + text input |
| `src/components/ChordVisualization/ChordPicker.test.tsx` | Tests for chord picker |
| `src/components/ChordVisualization/ChordFinderOverlay.tsx` | SVG fret highlight overlays + legend bar |
| `src/components/ChordVisualization/TransitionPicker.tsx` | From → To chord selector |
| `src/components/ChordVisualization/TransitionResults.tsx` | Ranked voicing pair list |

### Modified Files

| File | Changes |
|------|---------|
| `src/utils/noteUtils.ts` | Add `calculateFretNoteWithOctave()` that returns note + octave |
| `src/components/Fretboard/Fretboard.tsx` | Add fret click handler, pass `selectedFret` and chord state to children, render overlays |
| `src/components/Fretboard/NoteIndicators.tsx` | Add chord function coloring mode |
| `src/components/ControlPanel/ControlPanel.tsx` | Add "Chord Finder" and "Transitions" buttons |
| `src/App.tsx` | Wire `useChordState` hook, pass chord props to Fretboard and ControlPanel |

---

## Task 1: Chord Type Definitions

**Files:**
- Create: `src/types/chordTypes.ts`

- [ ] **Step 1: Create chord type definitions**

```typescript
// src/types/chordTypes.ts

export interface ChordName {
  root: string;
  quality: string;
  display: string;
}

export interface ScoredChordName extends ChordName {
  score: number;
}

export interface ChordLayers {
  core: string;
  extensions: string[];
}

export interface ChordDetectionResult {
  primary: ChordName;
  layers: ChordLayers;
  alternatives: ScoredChordName[];
}

export interface ChordDefinition {
  quality: string;
  intervals: number[];
}

export interface VoicingNote {
  stringNumber: number;
  note: string;
  pitchClass: string;
  chordFunction: string | null;
  isAlteredByControl: boolean;
  alteredBy: string | null;
}

export interface VoicingScore {
  completeness: number;
  simplicity: number;
  combined: number;
}

export interface VoicingResult {
  fret: number;
  engagedControls: string[];
  notes: VoicingNote[];
  score: VoicingScore;
}

export interface ControlChange {
  control: string;
  action: 'press' | 'release';
}

export interface TransitionEffort {
  fretDistance: number;
  controlChanges: ControlChange[];
  commonTones: number;
  totalScore: number;
}

export interface TransitionResult {
  from: VoicingResult;
  to: VoicingResult;
  effort: TransitionEffort;
}

export interface ChordFinderState {
  active: boolean;
  targetChord: { root: string; quality: string } | null;
  results: VoicingResult[];
}

export interface ChordTransitionState {
  active: boolean;
  chordA: { root: string; quality: string } | null;
  chordB: { root: string; quality: string } | null;
  results: TransitionResult[];
  selectedResultIndex: number | null;
}

export interface ChordState {
  selectedFret: number | null;
  chordFinder: ChordFinderState | null;
  chordTransition: ChordTransitionState | null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to chordTypes.ts

- [ ] **Step 3: Commit**

```bash
git add src/types/chordTypes.ts
git commit -m "feat(chord): add chord visualization type definitions"
```

---

## Task 2: Chord Dictionary

**Files:**
- Create: `src/utils/chordDictionary.ts`

- [ ] **Step 1: Create chord dictionary data**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/chordDictionary.ts
git commit -m "feat(chord): add chord dictionary with interval patterns"
```

---

## Task 3: Chord Detection — Core Algorithm

**Files:**
- Create: `src/utils/chordDetection.ts`
- Create: `src/utils/chordDetection.test.ts`

- [ ] **Step 1: Write failing tests for detectChord()**

```typescript
// src/utils/chordDetection.test.ts
import { describe, it, expect } from 'vitest';
import { detectChord } from './chordDetection';

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
    // Should include Em/C or similar slash chord interpretation
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
    // Should imply major quality from the major 3rd interval
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/chordDetection.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement detectChord()**

```typescript
// src/utils/chordDetection.ts
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

      // Score: prioritize completeness, root presence, fewer extra notes, simpler chords
      let score = matchRatio * 100;
      if (hasRoot) score += 30;
      if (matchCount === totalChordTones) score += 20; // Exact match bonus
      score -= extraNotes * 5;
      // Prefer simpler chords (fewer intervals) when match ratio is similar
      score -= chord.intervals.length * 2;

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/chordDetection.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/chordDetection.ts src/utils/chordDetection.test.ts
git commit -m "feat(chord): implement chord detection algorithm with tests"
```

---

## Task 4: Chord Name Parsing

**Files:**
- Modify: `src/utils/chordDetection.ts`
- Modify: `src/utils/chordDetection.test.ts`

- [ ] **Step 1: Write failing tests for parseChordName()**

Add to `src/utils/chordDetection.test.ts`:

```typescript
import { parseChordName } from './chordDetection';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/chordDetection.test.ts`
Expected: FAIL — parseChordName not found

- [ ] **Step 3: Implement parseChordName()**

Add to `src/utils/chordDetection.ts`:

```typescript
import { normalizeNoteName } from './noteUtils';

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
  'mM7': 'min7', // simplification
};

/**
 * Parse a chord name string into root and quality.
 * Examples: "Cmaj7", "F#m", "Bb7", "Gsus4"
 * Returns null if the string can't be parsed.
 */
export function parseChordName(input: string): { root: string; quality: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match root note: letter + optional # or b
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/chordDetection.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/chordDetection.ts src/utils/chordDetection.test.ts
git commit -m "feat(chord): add chord name parser with alias support"
```

---

## Task 5: Octave-Aware Note Calculation

**Files:**
- Modify: `src/utils/noteUtils.ts`
- Modify: `src/utils/noteUtils.test.ts`

The existing `calculateFretNote()` returns just the pitch class (e.g., "C#"). The voicing search needs octave info (e.g., "C#4"). Add a variant.

- [ ] **Step 1: Write failing tests**

Add to `src/utils/noteUtils.test.ts`:

```typescript
import { calculateFretNoteWithOctave } from './noteUtils';

describe('calculateFretNoteWithOctave', () => {
  it('returns note with octave at fret 0 with no controls', () => {
    const result = calculateFretNoteWithOctave('E4', 0, [], new Set());
    expect(result).toBe('E4');
  });

  it('increments octave when crossing B to C', () => {
    const result = calculateFretNoteWithOctave('B3', 1, [], new Set());
    expect(result).toBe('C4');
  });

  it('applies control changes and fret offset', () => {
    const changes = [{ control: 'A', semitones: 2 }];
    const result = calculateFretNoteWithOctave('E4', 3, changes, new Set(['A']));
    // E4 + 3 frets + 2 semitones = E4 + 5 = A4
    expect(result).toBe('A4');
  });

  it('handles octave wrap-around correctly', () => {
    const result = calculateFretNoteWithOctave('G#4', 5, [], new Set());
    // G#4 + 5 = C#5
    expect(result).toBe('C#5');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/noteUtils.test.ts`
Expected: FAIL — function not found

- [ ] **Step 3: Implement calculateFretNoteWithOctave()**

Add to `src/utils/noteUtils.ts`:

```typescript
/**
 * Like calculateFretNote but returns note name with octave (e.g., "C#4").
 */
export function calculateFretNoteWithOctave(
  openNote: string,
  fret: number,
  changes: StringChange[],
  engagedControls: Set<string> = new Set(),
): string {
  const { name, octave } = parseNote(openNote);
  const baseMidi = noteToMidi(openNote);

  let semitoneOffset = fret;
  for (const change of changes) {
    if (engagedControls.has(change.control)) {
      semitoneOffset += change.semitones;
    }
  }

  const resultMidi = baseMidi + semitoneOffset;
  const resultName = midiToNoteName(resultMidi);
  const resultOctave = Math.floor(resultMidi / 12) - 1;

  return `${resultName}${resultOctave}`;
}
```

Note: Also need to import `StringChange` from `../types` at the top of noteUtils.ts if not already imported.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/noteUtils.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/noteUtils.ts src/utils/noteUtils.test.ts
git commit -m "feat(chord): add octave-aware note calculation"
```

---

## Task 6: Physical Control Constraints

**Files:**
- Create: `src/utils/controlConstraints.ts`
- Create: `src/utils/controlConstraints.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/controlConstraints.test.ts
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
    // A and C are not adjacent
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/controlConstraints.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement generateValidCombinations()**

```typescript
// src/utils/controlConstraints.ts

/**
 * Generate all physically valid pedal/lever combinations.
 *
 * Constraints:
 * - Pedals: at most 2, and they must be adjacent in the pedals array
 * - Left knee levers: at most 1
 * - Right knee levers: at most 1
 *
 * Returns an array of string arrays, where each inner array is a valid
 * combination of control names that can be engaged simultaneously.
 */
export function generateValidCombinations(
  pedals: string[],
  leftKneeLevers: string[],
  rightKneeLevers: string[],
): string[][] {
  // Generate valid pedal groups: none, singles, adjacent pairs
  const pedalGroups: string[][] = [[]];
  for (let i = 0; i < pedals.length; i++) {
    pedalGroups.push([pedals[i]]);
    if (i + 1 < pedals.length) {
      pedalGroups.push([pedals[i], pedals[i + 1]]);
    }
  }

  // Generate valid left knee lever options: none or single
  const leftOptions: string[][] = [[]];
  for (const lk of leftKneeLevers) {
    leftOptions.push([lk]);
  }

  // Generate valid right knee lever options: none or single
  const rightOptions: string[][] = [[]];
  for (const rk of rightKneeLevers) {
    rightOptions.push([rk]);
  }

  // Cross-product all groups
  const combinations: string[][] = [];
  for (const pg of pedalGroups) {
    for (const lk of leftOptions) {
      for (const rk of rightOptions) {
        combinations.push([...pg, ...lk, ...rk]);
      }
    }
  }

  return combinations;
}

/**
 * Classify a copedent's knee levers into left and right groups.
 * Convention: levers starting with 'L' are left, 'R' are right.
 * Levers not matching either pattern are treated as right-side.
 */
export function classifyKneeLevers(kneeLevers: string[]): {
  left: string[];
  right: string[];
} {
  const left: string[] = [];
  const right: string[] = [];
  for (const lever of kneeLevers) {
    if (lever.startsWith('L')) {
      left.push(lever);
    } else {
      right.push(lever);
    }
  }
  return { left, right };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/controlConstraints.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/controlConstraints.ts src/utils/controlConstraints.test.ts
git commit -m "feat(chord): add physical control constraint generator"
```

---

## Task 7: Voicing Search

**Files:**
- Create: `src/utils/voicingSearch.ts`
- Create: `src/utils/voicingSearch.test.ts`

- [ ] **Step 1: Write failing tests using E9 preset data**

```typescript
// src/utils/voicingSearch.test.ts
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
    // Should have at least root and 3rd
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/voicingSearch.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement findVoicings()**

```typescript
// src/utils/voicingSearch.ts
import type { Copedent } from '../types';
import type { VoicingResult, VoicingNote, VoicingScore } from '../types/chordTypes';
import { NOTE_NAMES, calculateFretNoteWithOctave, calculateFretNote } from './noteUtils';
import { noteNameToSemitone, getChordTones } from './chordDetection';
import { generateValidCombinations, classifyKneeLevers } from './controlConstraints';
import { INTERVAL_TO_FUNCTION } from './chordDictionary';

const MAX_FRET = 12; // Notes repeat after fret 11

/**
 * Find all voicings for a target chord on a given copedent.
 * Returns results sorted by combined score (best first).
 */
export function findVoicings(
  root: string,
  quality: string,
  copedent: Copedent,
): VoicingResult[] {
  const chordTones = getChordTones(root, quality);
  const rootSemitone = noteNameToSemitone(root);
  const { left, right } = classifyKneeLevers(copedent.kneeLevers);
  const validCombos = generateValidCombinations(copedent.pedals, left, right);

  const results: VoicingResult[] = [];

  for (let fret = 0; fret < MAX_FRET; fret++) {
    for (const combo of validCombos) {
      const engagedSet = new Set(combo);
      const notes: VoicingNote[] = [];
      let matchedTones = 0;
      const foundTones = new Set<number>();

      for (const stringConfig of copedent.strings) {
        const noteWithOctave = calculateFretNoteWithOctave(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          engagedSet,
        );
        const pitchClass = calculateFretNote(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          engagedSet,
        );
        const openPitchClass = calculateFretNote(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          new Set(),
        );

        const semitone = noteNameToSemitone(pitchClass);
        const isChordTone = chordTones.includes(semitone);
        const interval = (semitone - rootSemitone + 12) % 12;
        const chordFunction = isChordTone ? (INTERVAL_TO_FUNCTION[interval] ?? null) : null;

        const isAltered = pitchClass !== openPitchClass;
        let alteredBy: string | null = null;
        if (isAltered) {
          // Find which engaged control altered this string
          for (const change of stringConfig.changes) {
            if (engagedSet.has(change.control)) {
              alteredBy = change.control;
              break;
            }
          }
        }

        if (isChordTone) {
          matchedTones++;
          foundTones.add(semitone);
        }

        notes.push({
          stringNumber: stringConfig.number,
          note: noteWithOctave,
          pitchClass,
          chordFunction,
          isAlteredByControl: isAltered,
          alteredBy,
        });
      }

      // Must have root + at least one defining tone (3rd or 7th)
      const hasRoot = foundTones.has(rootSemitone);
      const has3rd = foundTones.has((rootSemitone + 3) % 12) || foundTones.has((rootSemitone + 4) % 12);
      const has7th = foundTones.has((rootSemitone + 10) % 12) || foundTones.has((rootSemitone + 11) % 12);

      if (!hasRoot || (!has3rd && !has7th)) continue;

      const completeness = foundTones.size / chordTones.length;
      const maxControls = 4; // 2 pedals + 2 knee levers
      const simplicity = 1 - (combo.length / maxControls);
      const combined = completeness * 0.6 + simplicity * 0.4;

      const score: VoicingScore = { completeness, simplicity, combined };
      results.push({ fret, engagedControls: [...combo], notes, score });
    }
  }

  // Sort by combined score descending
  results.sort((a, b) => b.score.combined - a.score.combined);

  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/voicingSearch.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/voicingSearch.ts src/utils/voicingSearch.test.ts
git commit -m "feat(chord): implement voicing search with physical constraints"
```

---

## Task 8: Transition Scoring

**Files:**
- Create: `src/utils/transitionScoring.ts`
- Create: `src/utils/transitionScoring.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/transitionScoring.test.ts
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
      // First result should have lower totalScore (lower = easier)
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/transitionScoring.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement findTransitions()**

```typescript
// src/utils/transitionScoring.ts
import type { Copedent } from '../types';
import type { TransitionResult, TransitionEffort, ControlChange, VoicingResult } from '../types/chordTypes';
import { findVoicings } from './voicingSearch';

/**
 * Find the best voicing pairs for transitioning between two chords.
 * Returns results ranked by total effort (lower = easier transition).
 */
export function findTransitions(
  rootA: string,
  qualityA: string,
  rootB: string,
  qualityB: string,
  copedent: Copedent,
  maxResults: number = 5,
): TransitionResult[] {
  const voicingsA = findVoicings(rootA, qualityA, copedent).slice(0, 20);
  const voicingsB = findVoicings(rootB, qualityB, copedent).slice(0, 20);

  const results: TransitionResult[] = [];

  for (const from of voicingsA) {
    for (const to of voicingsB) {
      const effort = calculateEffort(from, to);
      results.push({ from, to, effort });
    }
  }

  // Sort by total effort ascending (easiest first)
  results.sort((a, b) => a.effort.totalScore - b.effort.totalScore);

  return results.slice(0, maxResults);
}

function calculateEffort(from: VoicingResult, to: VoicingResult): TransitionEffort {
  const fretDistance = Math.abs(from.fret - to.fret);

  // Calculate control changes
  const fromControls = new Set(from.engagedControls);
  const toControls = new Set(to.engagedControls);
  const controlChanges: ControlChange[] = [];

  for (const c of toControls) {
    if (!fromControls.has(c)) {
      controlChanges.push({ control: c, action: 'press' });
    }
  }
  for (const c of fromControls) {
    if (!toControls.has(c)) {
      controlChanges.push({ control: c, action: 'release' });
    }
  }

  // Count common tones (same pitch class on same string)
  let commonTones = 0;
  for (let i = 0; i < from.notes.length && i < to.notes.length; i++) {
    if (from.notes[i].pitchClass === to.notes[i].pitchClass) {
      commonTones++;
    }
  }

  // Calculate total effort score
  // Weights: fret distance is most costly, then control changes, common tones reduce effort
  const totalScore =
    fretDistance * 10 +
    controlChanges.length * 5 -
    commonTones * 2;

  return { fretDistance, controlChanges, commonTones, totalScore };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/transitionScoring.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/transitionScoring.ts src/utils/transitionScoring.test.ts
git commit -m "feat(chord): implement transition scoring between voicing pairs"
```

---

## Task 9: Chord Function Color Constants

**Files:**
- Create: `src/utils/chordFunctionColors.ts`

- [ ] **Step 1: Create color mapping**

```typescript
// src/utils/chordFunctionColors.ts

/** Chord function → color mapping for note indicators */
export const CHORD_FUNCTION_COLORS: Record<string, string> = {
  root: '#00E5D0',    // Cyan — app primary accent
  '3rd': '#e63946',   // Red — defines major/minor
  'b3': '#e63946',    // Red — minor 3rd
  '5th': '#7B8CDE',   // Periwinkle — supporting tone
  'b5': '#7B8CDE',    // Periwinkle
  '#5': '#7B8CDE',    // Periwinkle
  '7th': '#F4A261',   // Orange — harmonic color
  'b7': '#F4A261',    // Orange — dominant 7th
  '6th': '#F4A261',   // Orange — similar role to 7th
  // Extensions — all purple
  '9': '#9b59b6',
  'b9': '#9b59b6',
  '#9': '#9b59b6',
  '4th': '#9b59b6',
  '11': '#9b59b6',
  '#11': '#9b59b6',
  '13': '#9b59b6',
};

/** Default color for notes not in the chord */
export const NON_CHORD_TONE_COLOR = '#444444';

/** Get the color for a chord function label, falling back to extension purple */
export function getChordFunctionColor(chordFunction: string | null): string {
  if (!chordFunction) return NON_CHORD_TONE_COLOR;
  return CHORD_FUNCTION_COLORS[chordFunction] ?? '#9b59b6';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/chordFunctionColors.ts
git commit -m "feat(chord): add chord function color mapping"
```

---

## Task 10: Chord State Hook

**Files:**
- Create: `src/hooks/useChordState.ts`
- Create: `src/hooks/useChordState.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/useChordState.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChordState } from './useChordState';

describe('useChordState', () => {
  it('initializes with no fret selected', () => {
    const { result } = renderHook(() => useChordState());
    expect(result.current.selectedFret).toBeNull();
  });

  it('selects and deselects a fret', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.selectFret(3));
    expect(result.current.selectedFret).toBe(3);
    act(() => result.current.selectFret(null));
    expect(result.current.selectedFret).toBeNull();
  });

  it('toggles same fret off', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.selectFret(3));
    act(() => result.current.selectFret(3));
    expect(result.current.selectedFret).toBeNull();
  });

  it('initializes chord finder as inactive', () => {
    const { result } = renderHook(() => useChordState());
    expect(result.current.chordFinder).toBeNull();
  });

  it('activates chord finder with a target chord', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateChordFinder('C', 'maj'));
    expect(result.current.chordFinder).not.toBeNull();
    expect(result.current.chordFinder!.active).toBe(true);
    expect(result.current.chordFinder!.targetChord).toEqual({ root: 'C', quality: 'maj' });
  });

  it('deactivates chord finder', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateChordFinder('C', 'maj'));
    act(() => result.current.deactivateChordFinder());
    expect(result.current.chordFinder).toBeNull();
  });

  it('activates chord transition', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    expect(result.current.chordTransition).not.toBeNull();
    expect(result.current.chordTransition!.chordA).toEqual({ root: 'E', quality: 'maj' });
    expect(result.current.chordTransition!.chordB).toEqual({ root: 'A', quality: 'maj' });
  });

  it('selects a transition result', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    act(() => result.current.selectTransitionResult(2));
    expect(result.current.chordTransition!.selectedResultIndex).toBe(2);
  });

  it('deactivates transition', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    act(() => result.current.deactivateTransition());
    expect(result.current.chordTransition).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useChordState.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useChordState()**

```typescript
// src/hooks/useChordState.ts
import { useState, useCallback } from 'react';
import type {
  ChordState,
  ChordFinderState,
  ChordTransitionState,
} from '../types/chordTypes';

export function useChordState() {
  const [selectedFret, setSelectedFret] = useState<number | null>(null);
  const [chordFinder, setChordFinder] = useState<ChordFinderState | null>(null);
  const [chordTransition, setChordTransition] = useState<ChordTransitionState | null>(null);

  const selectFret = useCallback((fret: number | null) => {
    setSelectedFret(prev => (prev === fret ? null : fret));
  }, []);

  const activateChordFinder = useCallback((root: string, quality: string) => {
    setChordFinder({
      active: true,
      targetChord: { root, quality },
      results: [], // Results computed externally via useMemo in App
    });
    setChordTransition(null); // Deactivate transition when finder activates
  }, []);

  const deactivateChordFinder = useCallback(() => {
    setChordFinder(null);
  }, []);

  const activateTransition = useCallback(
    (rootA: string, qualityA: string, rootB: string, qualityB: string) => {
      setChordTransition({
        active: true,
        chordA: { root: rootA, quality: qualityA },
        chordB: { root: rootB, quality: qualityB },
        results: [], // Results computed externally via useMemo in App
        selectedResultIndex: null,
      });
      setChordFinder(null); // Deactivate finder when transition activates
    },
    [],
  );

  const selectTransitionResult = useCallback((index: number) => {
    setChordTransition(prev =>
      prev ? { ...prev, selectedResultIndex: index } : null,
    );
  }, []);

  const deactivateTransition = useCallback(() => {
    setChordTransition(null);
  }, []);

  return {
    selectedFret,
    chordFinder,
    chordTransition,
    selectFret,
    activateChordFinder,
    deactivateChordFinder,
    activateTransition,
    selectTransitionResult,
    deactivateTransition,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useChordState.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useChordState.ts src/hooks/useChordState.test.ts
git commit -m "feat(chord): add chord state management hook"
```

---

## Task 11: Fretboard Click Handler & Fret Selection

**Files:**
- Modify: `src/components/Fretboard/Fretboard.tsx`

- [ ] **Step 1: Add fret click handler and selection highlight**

Modify `Fretboard.tsx` to accept new props and add click regions:

Add to the `FretboardProps` interface:

```typescript
interface FretboardProps {
  copedent: Copedent;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  // New chord props
  selectedFret?: number | null;
  onFretClick?: (fret: number) => void;
  chordDetection?: ChordDetectionResult | null;
}
```

Inside the SVG `<g>` that contains the fretboard area (after the `transform` group), add clickable fret regions and a selection highlight:

```typescript
{/* Clickable fret regions — invisible rects for click targets */}
{Array.from({ length: 12 }, (_, fret) => {
  const x1 = fret === 0 ? 0 : getFretX(fret, fretboardWidth);
  const x2 = getFretX(fret + 1, fretboardWidth);
  return (
    <rect
      key={`fret-click-${fret}`}
      x={LEFT_MARGIN + x1}
      y={TOP_LABEL_HEIGHT}
      width={x2 - x1}
      height={FRETBOARD_HEIGHT}
      fill="transparent"
      className="cursor-pointer"
      onClick={() => onFretClick?.(fret)}
    />
  );
})}

{/* Selected fret highlight */}
{selectedFret != null && (
  <rect
    x={LEFT_MARGIN + (selectedFret === 0 ? 0 : getFretX(selectedFret, fretboardWidth))}
    y={TOP_LABEL_HEIGHT}
    width={getFretX(selectedFret + 1, fretboardWidth) - (selectedFret === 0 ? 0 : getFretX(selectedFret, fretboardWidth))}
    height={FRETBOARD_HEIGHT}
    rx={4}
    fill="#00E5D0"
    fillOpacity={0.08}
    stroke="#00E5D0"
    strokeOpacity={0.4}
    strokeWidth={2}
    strokeDasharray="4,3"
    pointerEvents="none"
  />
)}
```

- [ ] **Step 2: Verify the app still renders correctly**

Run: `npm run dev` and visually verify the fretboard renders. Click frets to see the highlight. Press Escape to deselect.

- [ ] **Step 3: Update Fretboard tests**

Add to `src/components/Fretboard/Fretboard.test.tsx`:

```typescript
it('calls onFretClick when a fret region is clicked', () => {
  const onFretClick = vi.fn();
  const { container } = render(
    <Fretboard {...defaultProps} onFretClick={onFretClick} selectedFret={null} />
  );
  const fretRegions = container.querySelectorAll('[class*="cursor-pointer"]');
  expect(fretRegions.length).toBe(12);
  fretRegions[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(onFretClick).toHaveBeenCalledWith(3);
});

it('renders selection highlight when selectedFret is set', () => {
  const { container } = render(
    <Fretboard {...defaultProps} selectedFret={5} />
  );
  const highlight = container.querySelector('rect[stroke-dasharray]');
  expect(highlight).toBeTruthy();
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/Fretboard/Fretboard.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard/Fretboard.tsx src/components/Fretboard/Fretboard.test.tsx
git commit -m "feat(chord): add fret click handler and selection highlight to Fretboard"
```

---

## Task 12: NoteIndicators Chord Function Coloring

**Files:**
- Modify: `src/components/Fretboard/NoteIndicators.tsx`

- [ ] **Step 1: Add chord function color mode**

Extend the `NoteIndicatorsProps` interface:

```typescript
interface NoteIndicatorsProps {
  // ... existing props
  chordNotes?: Map<string, string> | null;
  // Maps pitch class (e.g., "C#") to chord function (e.g., "3rd").
  // When set, notes matching a chord tone use function colors.
  // Non-matching notes are dimmed.
}
```

Update the rendering logic inside the fret/string loops. Replace the existing highlight color logic:

```typescript
// Existing logic:
// const isHighlighted = activeNote !== openFretNote;
// fill={isHighlighted ? '#e63946' : '#1f2937'}

// New logic:
let fillColor: string;
let textColor: string;
let opacity = 1;

if (chordNotes && chordNotes.size > 0) {
  const chordFunction = chordNotes.get(activeNote) ?? null;
  fillColor = getChordFunctionColor(chordFunction);
  textColor = chordFunction ? fillColor : '#777';
  opacity = chordFunction ? 1 : 0.3;
} else {
  const isHighlighted = activeNote !== openFretNote;
  fillColor = isHighlighted ? '#e63946' : '#1f2937';
  textColor = '#fff';
}
```

Import `getChordFunctionColor` from `../../utils/chordFunctionColors`.

Also render the chord function label below the note name when a chord function is assigned:

```typescript
{chordFunction && (
  <text
    x={x}
    y={y + 8}
    textAnchor="middle"
    fill={fillColor}
    fontSize={6}
    opacity={0.7}
  >
    {chordFunction}
  </text>
)}
```

- [ ] **Step 2: Verify the app renders correctly**

Run: `npm run dev`. Without chord state active, the fretboard should look identical to before. When a fret is selected (with chord detection wired later), notes should show chord function colors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Fretboard/NoteIndicators.tsx
git commit -m "feat(chord): add chord function coloring to NoteIndicators"
```

---

## Task 13: Chord Analyzer Badge

**Files:**
- Create: `src/components/ChordVisualization/ChordAnalyzerBadge.tsx`
- Create: `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChordAnalyzerBadge } from './ChordAnalyzerBadge';

const mockDetection = {
  primary: { root: 'E', quality: 'maj', display: 'Emaj' },
  layers: { core: 'Emaj', extensions: ['9 (F#)'] },
  alternatives: [
    { root: 'C#', quality: 'min', display: 'C#min', score: 80 },
  ],
};

describe('ChordAnalyzerBadge', () => {
  it('renders chord name', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('shows fret label', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={3} hasEngagedControls={false} />
    );
    expect(getByText(/FRET 3/)).toBeTruthy();
  });

  it('shows OPEN STRINGS when fret is 0 or null', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={null} hasEngagedControls={false} />
    );
    expect(getByText(/OPEN STRINGS/)).toBeTruthy();
  });

  it('uses red border when controls are engaged', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={true} />
    );
    const badge = container.firstElementChild;
    expect(badge?.className).toContain('border-red');
  });

  it('shows extensions when present', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(getByText(/9/)).toBeTruthy();
  });

  it('expands on click to show alternatives', () => {
    const { getByText, queryByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(queryByText('C#min')).toBeFalsy();
    fireEvent.click(getByText('Emaj'));
    expect(getByText('C#min')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ChordAnalyzerBadge**

```typescript
// src/components/ChordVisualization/ChordAnalyzerBadge.tsx
import { useState } from 'react';
import type { ChordDetectionResult } from '../../types/chordTypes';

interface ChordAnalyzerBadgeProps {
  detection: ChordDetectionResult | null;
  fret: number | null;
  hasEngagedControls: boolean;
}

export function ChordAnalyzerBadge({
  detection,
  fret,
  hasEngagedControls,
}: ChordAnalyzerBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!detection) return null;

  const borderColor = hasEngagedControls ? 'border-red-500' : 'border-cyan-400';
  const fretLabel = fret == null || fret === 0 ? 'OPEN STRINGS' : `CHORD AT FRET ${fret}`;
  const { primary, layers, alternatives } = detection;

  return (
    <div
      className={`absolute top-2 right-2 rounded-lg border-2 ${borderColor} bg-gray-950 px-3 py-2 cursor-pointer z-10 min-w-[160px]`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">
        {fretLabel}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${hasEngagedControls ? 'text-red-500' : 'text-cyan-400'}`}>
          {primary.display}
        </span>
        {layers.extensions.length > 0 && (
          <span className="text-sm text-indigo-400">
            + {layers.extensions.map(e => e.split(' ')[0]).join(', ')}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {layers.extensions.length > 0 && (
            <div className="text-xs text-gray-400 mb-1">
              Extensions: {layers.extensions.join(', ')}
            </div>
          )}
          {alternatives.length > 0 && (
            <div className="text-xs text-gray-500">
              <div className="mb-1">Also:</div>
              {alternatives.slice(0, 3).map((alt, i) => (
                <div key={i} className="text-gray-400">{alt.display}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ChordVisualization/ChordAnalyzerBadge.tsx src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx
git commit -m "feat(chord): add always-on chord analyzer badge component"
```

---

## Task 14: Chord Detail Popover

**Files:**
- Create: `src/components/ChordVisualization/ChordDetailPopover.tsx`

- [ ] **Step 1: Implement ChordDetailPopover**

```typescript
// src/components/ChordVisualization/ChordDetailPopover.tsx
import type { ChordDetectionResult } from '../../types/chordTypes';

interface ChordDetailPopoverProps {
  detection: ChordDetectionResult;
  x: number;
  y: number;
}

export function ChordDetailPopover({ detection, x, y }: ChordDetailPopoverProps) {
  const { primary, layers, alternatives } = detection;

  return (
    <foreignObject x={x - 180} y={y} width={360} height={80}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-lg">
        <div className="flex items-baseline gap-3">
          <span className="text-gray-500">Core:</span>
          <span className="text-white font-bold">{layers.core}</span>
          {layers.extensions.length > 0 && (
            <>
              <span className="text-gray-500">Extensions:</span>
              <span className="text-indigo-400">{layers.extensions.join(', ')}</span>
            </>
          )}
        </div>
        {alternatives.length > 0 && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-gray-500">Also:</span>
            <span className="text-gray-400">
              {alternatives.slice(0, 3).map(a => a.display).join('  ·  ')}
            </span>
          </div>
        )}
      </div>
    </foreignObject>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ChordVisualization/ChordDetailPopover.tsx
git commit -m "feat(chord): add chord detail popover component"
```

---

## Task 15: Chord Picker

**Files:**
- Create: `src/components/ChordVisualization/ChordPicker.tsx`
- Create: `src/components/ChordVisualization/ChordPicker.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/ChordVisualization/ChordPicker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChordPicker } from './ChordPicker';

describe('ChordPicker', () => {
  it('renders root note buttons', () => {
    const { getByText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={vi.fn()} />
    );
    expect(getByText('C')).toBeTruthy();
    expect(getByText('F#')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });

  it('renders quality buttons', () => {
    const { getByText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={vi.fn()} />
    );
    expect(getByText('maj')).toBeTruthy();
    expect(getByText('min')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
  });

  it('calls onChordSelect when root + quality are picked', () => {
    const onSelect = vi.fn();
    const { getByText } = render(
      <ChordPicker onChordSelect={onSelect} onClose={vi.fn()} />
    );
    fireEvent.click(getByText('G'));
    fireEvent.click(getByText('min7'));
    expect(onSelect).toHaveBeenCalledWith('G', 'min7');
  });

  it('has a text input that parses chord names', () => {
    const onSelect = vi.fn();
    const { getByPlaceholderText } = render(
      <ChordPicker onChordSelect={onSelect} onClose={vi.fn()} />
    );
    const input = getByPlaceholderText(/type/i);
    fireEvent.change(input, { target: { value: 'Cmaj7' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('C', 'maj7');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ChordVisualization/ChordPicker.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ChordPicker**

```typescript
// src/components/ChordVisualization/ChordPicker.tsx
import { useState } from 'react';
import { NOTE_NAMES } from '../../utils/noteUtils';
import { parseChordName } from '../../utils/chordDetection';

const COMMON_QUALITIES = [
  'maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug',
  '9', 'min9', '13', 'm7b5', 'dim7', 'sus2', 'sus4',
];

interface ChordPickerProps {
  onChordSelect: (root: string, quality: string) => void;
  onClose: () => void;
  selectedRoot?: string | null;
  selectedQuality?: string | null;
}

export function ChordPicker({
  onChordSelect,
  onClose,
  selectedRoot = null,
  selectedQuality = null,
}: ChordPickerProps) {
  const [root, setRoot] = useState<string | null>(selectedRoot);
  const [textInput, setTextInput] = useState('');

  const handleRootClick = (noteName: string) => {
    setRoot(noteName);
    if (selectedQuality) {
      onChordSelect(noteName, selectedQuality);
    }
  };

  const handleQualityClick = (quality: string) => {
    if (root) {
      onChordSelect(root, quality);
    }
  };

  const handleTextSubmit = () => {
    const parsed = parseChordName(textInput);
    if (parsed) {
      setRoot(parsed.root);
      onChordSelect(parsed.root, parsed.quality);
      setTextInput('');
    }
  };

  return (
    <div className="inline-flex items-start gap-3 bg-gray-900 border border-gray-700 rounded-xl p-3">
      {/* Root selector */}
      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Root</div>
        <div className="grid grid-cols-6 gap-1">
          {NOTE_NAMES.map(name => (
            <button
              key={name}
              onClick={() => handleRootClick(name)}
              className={`px-2 py-1 text-xs rounded ${
                root === name
                  ? 'bg-cyan-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-16 bg-gray-700 self-center" />

      {/* Quality selector */}
      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Quality</div>
        <div className="flex flex-wrap gap-1 max-w-[280px]">
          {COMMON_QUALITIES.map(q => (
            <button
              key={q}
              onClick={() => handleQualityClick(q)}
              className={`px-2 py-1 text-xs rounded ${
                selectedQuality === q
                  ? 'bg-cyan-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-16 bg-gray-700 self-center" />

      {/* Text input */}
      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Or type</div>
        <input
          type="text"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          placeholder="e.g. Cmaj9#11"
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 w-28"
        />
        <div className="text-gray-600 text-[9px] mt-1">Press Enter</div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-gray-500 hover:text-gray-300 text-lg self-start"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ChordVisualization/ChordPicker.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ChordVisualization/ChordPicker.tsx src/components/ChordVisualization/ChordPicker.test.tsx
git commit -m "feat(chord): add chord picker component with root/quality/text input"
```

---

## Task 16: Chord Finder Overlay

**Files:**
- Create: `src/components/ChordVisualization/ChordFinderOverlay.tsx`

This renders SVG highlight overlays on the fretboard for chord finder results.

- [ ] **Step 1: Implement ChordFinderOverlay**

```typescript
// src/components/ChordVisualization/ChordFinderOverlay.tsx
import type { VoicingResult } from '../../types/chordTypes';
import { getFretX } from '../../utils/fretUtils';

interface ChordFinderOverlayProps {
  results: VoicingResult[];
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  targetChord: { root: string; quality: string };
}

export function ChordFinderOverlay({
  results,
  fretboardWidth,
  fretboardHeight,
  leftMargin,
  targetChord,
}: ChordFinderOverlayProps) {
  // Group results by fret, take best score per fret
  const byFret = new Map<number, VoicingResult>();
  for (const r of results) {
    const existing = byFret.get(r.fret);
    if (!existing || r.score.combined > existing.score.combined) {
      byFret.set(r.fret, r);
    }
  }

  return (
    <g>
      {Array.from(byFret.entries()).map(([fret, voicing]) => {
        const x1 = fret === 0 ? 0 : getFretX(fret, fretboardWidth);
        const x2 = getFretX(fret + 1, fretboardWidth);
        const noPedals = voicing.engagedControls.length === 0;
        const opacity = noPedals ? 0.6 : 0.35;
        const dashArray = noPedals ? 'none' : '4,3';

        return (
          <g key={`finder-${fret}`}>
            <rect
              x={leftMargin + x1}
              y={0}
              width={x2 - x1}
              height={fretboardHeight}
              rx={4}
              fill="#00E5D0"
              fillOpacity={noPedals ? 0.08 : 0.04}
              stroke="#00E5D0"
              strokeOpacity={opacity}
              strokeWidth={noPedals ? 2 : 1.5}
              strokeDasharray={dashArray}
              pointerEvents="none"
            />
            {/* Pedal badge below fret if needed */}
            {!noPedals && (
              <foreignObject
                x={leftMargin + x1}
                y={fretboardHeight + 2}
                width={x2 - x1}
                height={18}
              >
                <div className="text-center">
                  <span className="text-[8px] text-red-500 bg-red-500/20 rounded px-1">
                    + {voicing.engagedControls.join(', ')}
                  </span>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ChordVisualization/ChordFinderOverlay.tsx
git commit -m "feat(chord): add chord finder fretboard overlay component"
```

---

## Task 17: Transition Picker & Results

**Files:**
- Create: `src/components/ChordVisualization/TransitionPicker.tsx`
- Create: `src/components/ChordVisualization/TransitionResults.tsx`

- [ ] **Step 1: Implement TransitionPicker**

```typescript
// src/components/ChordVisualization/TransitionPicker.tsx
import { useState } from 'react';
import { ChordPicker } from './ChordPicker';

interface TransitionPickerProps {
  onTransitionSelect: (rootA: string, qualityA: string, rootB: string, qualityB: string) => void;
  onClose: () => void;
  chordA?: { root: string; quality: string } | null;
  chordB?: { root: string; quality: string } | null;
}

export function TransitionPicker({
  onTransitionSelect,
  onClose,
  chordA: initialA = null,
  chordB: initialB = null,
}: TransitionPickerProps) {
  const [chordA, setChordA] = useState(initialA);
  const [chordB, setChordB] = useState(initialB);
  const [editing, setEditing] = useState<'A' | 'B'>('A');

  const handleSelect = (root: string, quality: string) => {
    if (editing === 'A') {
      const newA = { root, quality };
      setChordA(newA);
      setEditing('B');
      if (chordB) {
        onTransitionSelect(root, quality, chordB.root, chordB.quality);
      }
    } else {
      const newB = { root, quality };
      setChordB(newB);
      if (chordA) {
        onTransitionSelect(chordA.root, chordA.quality, root, quality);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Chord A display */}
        <button
          onClick={() => setEditing('A')}
          className={`rounded-lg border-2 px-4 py-2 min-w-[80px] text-center ${
            editing === 'A' ? 'border-cyan-400' : 'border-gray-700'
          }`}
        >
          <div className="text-cyan-400 text-[9px] uppercase">From</div>
          <div className="text-cyan-400 text-lg font-bold">
            {chordA ? `${chordA.root}${chordA.quality}` : '—'}
          </div>
        </button>

        <span className="text-gray-500 text-2xl">→</span>

        {/* Chord B display */}
        <button
          onClick={() => setEditing('B')}
          className={`rounded-lg border-2 px-4 py-2 min-w-[80px] text-center ${
            editing === 'B' ? 'border-red-500' : 'border-gray-700'
          }`}
        >
          <div className="text-red-500 text-[9px] uppercase">To</div>
          <div className="text-red-500 text-lg font-bold">
            {chordB ? `${chordB.root}${chordB.quality}` : '—'}
          </div>
        </button>

        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-500 hover:text-gray-300 text-lg ml-auto"
        >
          ×
        </button>
      </div>

      <ChordPicker
        onChordSelect={handleSelect}
        onClose={onClose}
        selectedRoot={editing === 'A' ? chordA?.root : chordB?.root}
        selectedQuality={editing === 'A' ? chordA?.quality : chordB?.quality}
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement TransitionResults**

```typescript
// src/components/ChordVisualization/TransitionResults.tsx
import type { TransitionResult } from '../../types/chordTypes';

interface TransitionResultsProps {
  results: TransitionResult[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function TransitionResults({
  results,
  selectedIndex,
  onSelect,
}: TransitionResultsProps) {
  if (results.length === 0) {
    return <div className="text-gray-500 text-sm">No transitions found.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {results.map((result, i) => {
        const isSelected = selectedIndex === i;
        const { from, to, effort } = result;

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg text-left ${
              isSelected
                ? 'bg-gray-800 border border-cyan-400/40'
                : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {/* Rank */}
            <div className="text-gray-500 text-sm font-mono w-6">#{i + 1}</div>

            {/* From voicing */}
            <div className="text-center">
              <div className="text-cyan-400 text-xs">Fret {from.fret}</div>
              <div className="text-gray-500 text-[10px]">
                {from.engagedControls.length === 0
                  ? 'No pedals'
                  : from.engagedControls.join(' + ')}
              </div>
            </div>

            <span className="text-gray-600">→</span>

            {/* To voicing */}
            <div className="text-center">
              <div className="text-red-500 text-xs">Fret {to.fret}</div>
              <div className="text-gray-500 text-[10px]">
                {to.engagedControls.length === 0
                  ? 'No pedals'
                  : to.engagedControls.join(' + ')}
              </div>
            </div>

            <div className="w-px h-8 bg-gray-700" />

            {/* Effort summary */}
            <div className="text-xs">
              <div className="text-gray-400">
                Bar: <span className={effort.fretDistance === 0 ? 'text-cyan-400' : 'text-orange-400'}>
                  {effort.fretDistance === 0 ? 'none' : `${effort.fretDistance} frets`}
                </span>
              </div>
              <div className="text-gray-400">
                Changes: <span className={effort.controlChanges.length === 0 ? 'text-cyan-400' : 'text-red-400'}>
                  {effort.controlChanges.length === 0
                    ? 'none'
                    : effort.controlChanges.map(c => `${c.action === 'press' ? '+' : '-'}${c.control}`).join(', ')}
                </span>
              </div>
              <div className="text-gray-400">
                Common: <span className="text-indigo-400">{effort.commonTones} strings</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ChordVisualization/TransitionPicker.tsx src/components/ChordVisualization/TransitionResults.tsx
git commit -m "feat(chord): add transition picker and results list components"
```

---

## Task 18: Wire Everything into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ControlPanel/ControlPanel.tsx`
- Modify: `src/components/Fretboard/Fretboard.tsx`

This is the integration task that connects all the pieces.

- [ ] **Step 1: Add chord state and computed results to App.tsx**

Import the new hook and chord utilities:

```typescript
import { useChordState } from './hooks/useChordState';
import { detectChord } from './utils/chordDetection';
import { findVoicings } from './utils/voicingSearch';
import { findTransitions } from './utils/transitionScoring';
import { calculateFretNote, NOTE_NAMES } from './utils/noteUtils';
import { ChordAnalyzerBadge } from './components/ChordVisualization/ChordAnalyzerBadge';
import { ChordPicker } from './components/ChordVisualization/ChordPicker';
import { ChordFinderOverlay } from './components/ChordVisualization/ChordFinderOverlay';
import { TransitionPicker } from './components/ChordVisualization/TransitionPicker';
import { TransitionResults } from './components/ChordVisualization/TransitionResults';
```

Add chord state and computed values inside the `App` function:

```typescript
const chordState = useChordState();

// Compute chord detection for current fret + controls
const currentDetection = useMemo(() => {
  const fret = chordState.selectedFret ?? 0;
  const notes = state.activeCopedent.strings.map(s =>
    calculateFretNote(s.openNote, fret, s.changes, state.engagedControls)
  );
  return detectChord(notes);
}, [chordState.selectedFret, state.engagedControls, state.activeCopedent]);

// Compute chord notes map for coloring (pitch class → chord function)
const chordNotesMap = useMemo(() => {
  if (!currentDetection || chordState.selectedFret == null) return null;
  const map = new Map<string, string>();
  // Use the primary chord's tones to build the map
  const rootSemitone = NOTE_NAMES.indexOf(currentDetection.primary.root as typeof NOTE_NAMES[number]);
  if (rootSemitone === -1) return null;
  // Build from chord dictionary for the detected chord
  const { getChordTones } = require('./utils/chordDetection');
  const { INTERVAL_TO_FUNCTION } = require('./utils/chordDictionary');
  const tones = getChordTones(currentDetection.primary.root, currentDetection.primary.quality);
  for (const semitone of tones) {
    const noteName = NOTE_NAMES[semitone % 12];
    const interval = (semitone - rootSemitone + 12) % 12;
    map.set(noteName, INTERVAL_TO_FUNCTION[interval] ?? 'root');
  }
  return map;
}, [currentDetection, chordState.selectedFret]);

// Compute voicing search results for chord finder
const finderResults = useMemo(() => {
  if (!chordState.chordFinder?.targetChord) return [];
  const { root, quality } = chordState.chordFinder.targetChord;
  return findVoicings(root, quality, state.activeCopedent);
}, [chordState.chordFinder?.targetChord, state.activeCopedent]);

// Compute transition results
const transitionResults = useMemo(() => {
  if (!chordState.chordTransition?.chordA || !chordState.chordTransition?.chordB) return [];
  const { chordA, chordB } = chordState.chordTransition;
  return findTransitions(chordA.root, chordA.quality, chordB.root, chordB.quality, state.activeCopedent);
}, [chordState.chordTransition?.chordA, chordState.chordTransition?.chordB, state.activeCopedent]);
```

**Important:** Replace the `require()` calls with proper static imports — the code above is pseudocode. Use the already-imported `getChordTones` and `INTERVAL_TO_FUNCTION`.

Update the Escape key handler to also deselect frets:

```typescript
if (e.key === 'Escape') {
  state.clearAllControls();
  chordState.selectFret(null);
  chordState.deactivateChordFinder();
  chordState.deactivateTransition();
}
```

- [ ] **Step 2: Add chord controls to ControlPanel**

Extend `ControlPanelProps` with:

```typescript
interface ControlPanelProps {
  // ... existing
  onChordFinderToggle?: () => void;
  onTransitionToggle?: () => void;
  chordFinderActive?: boolean;
  transitionActive?: boolean;
}
```

Add two buttons in the control panel layout (in the bottom bar next to Clear All):

```typescript
<button
  onClick={onChordFinderToggle}
  className={`px-3 py-1 rounded text-sm ${
    chordFinderActive ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
  Chord Finder
</button>
<button
  onClick={onTransitionToggle}
  className={`px-3 py-1 rounded text-sm ${
    transitionActive ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
  Transitions
</button>
```

- [ ] **Step 3: Wire overlays and pickers into the App layout**

In App.tsx's JSX, add the chord visualization components:

```typescript
<main className="p-6 space-y-6">
  {/* Chord Picker (above fretboard) */}
  {chordState.chordFinder?.active && (
    <ChordPicker
      onChordSelect={(root, quality) => chordState.activateChordFinder(root, quality)}
      onClose={() => chordState.deactivateChordFinder()}
      selectedRoot={chordState.chordFinder.targetChord?.root}
      selectedQuality={chordState.chordFinder.targetChord?.quality}
    />
  )}

  {/* Transition Picker (above fretboard, replaces chord picker) */}
  {chordState.chordTransition?.active && (
    <TransitionPicker
      onTransitionSelect={(rA, qA, rB, qB) => chordState.activateTransition(rA, qA, rB, qB)}
      onClose={() => chordState.deactivateTransition()}
      chordA={chordState.chordTransition.chordA}
      chordB={chordState.chordTransition.chordB}
    />
  )}

  {/* Fretboard with chord overlays */}
  <div className="relative">
    <Fretboard
      copedent={state.activeCopedent}
      engagedControls={state.engagedControls}
      displayMode={state.displayMode}
      selectedKey={state.selectedKey}
      selectedFret={chordState.selectedFret}
      onFretClick={(fret) => chordState.selectFret(fret)}
      chordNotes={chordNotesMap}
      finderResults={finderResults}
    />
    <ChordAnalyzerBadge
      detection={currentDetection}
      fret={chordState.selectedFret}
      hasEngagedControls={state.engagedControls.size > 0}
    />
  </div>

  {/* Transition Results (below fretboard) */}
  {chordState.chordTransition?.active && transitionResults.length > 0 && (
    <TransitionResults
      results={transitionResults}
      selectedIndex={chordState.chordTransition.selectedResultIndex}
      onSelect={(idx) => chordState.selectTransitionResult(idx)}
    />
  )}

  <ControlPanel
    pedals={state.activeCopedent.pedals}
    kneeLevers={state.activeCopedent.kneeLevers}
    engagedControls={state.engagedControls}
    onToggleControl={state.toggleControl}
    onClearAll={state.clearAllControls}
    displayMode={state.displayMode}
    selectedKey={state.selectedKey}
    onDisplayModeChange={state.setDisplayMode}
    onSelectedKeyChange={state.setSelectedKey}
    chordFinderActive={chordState.chordFinder?.active ?? false}
    transitionActive={chordState.chordTransition?.active ?? false}
    onChordFinderToggle={() => {
      if (chordState.chordFinder?.active) {
        chordState.deactivateChordFinder();
      } else {
        chordState.activateChordFinder('C', 'maj');
      }
    }}
    onTransitionToggle={() => {
      if (chordState.chordTransition?.active) {
        chordState.deactivateTransition();
      } else {
        chordState.activateTransition('E', 'maj', 'A', 'maj');
      }
    }}
  />
  {editorOpen && <CopedentEditor {...editorProps} />}
</main>
```

- [ ] **Step 4: Pass finderResults and ChordFinderOverlay into Fretboard**

In `Fretboard.tsx`, accept the optional `finderResults` prop and render `ChordFinderOverlay` inside the SVG:

```typescript
// In Fretboard SVG, inside the transformed group:
{finderResults && finderResults.length > 0 && (
  <ChordFinderOverlay
    results={finderResults}
    fretboardWidth={fretboardWidth}
    fretboardHeight={FRETBOARD_HEIGHT}
    leftMargin={LEFT_MARGIN}
    targetChord={/* passed from parent */}
  />
)}
```

- [ ] **Step 5: Verify the app builds and runs**

Run: `npm run build`
Expected: Build succeeds with no errors

Run: `npm run dev`
Expected: App loads, fretboard is clickable, analyzer badge appears, chord finder and transition buttons work

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/ControlPanel/ControlPanel.tsx src/components/Fretboard/Fretboard.tsx
git commit -m "feat(chord): wire chord visualization into app shell"
```

---

## Task 19: Final Integration Test & Polish

**Files:**
- Run all tests
- Visual verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Fix any failing tests**

Address any type mismatches, import issues, or prop changes that broke existing tests. Update test files as needed.

- [ ] **Step 3: Visual smoke test**

Run: `npm run dev` and verify:
1. Open app with E9 copedent — analyzer badge shows "Emaj" (or similar)
2. Click fret 3 — fret highlights, badge updates, notes show chord function colors
3. Toggle pedals A+B — badge updates to show new chord
4. Open Chord Finder — pick "A maj" — frets highlight showing where A major is playable
5. Open Transitions — pick E→A — see ranked results list
6. Click a transition result — both voicings highlight on fretboard
7. Press Escape — everything deselects

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(chord): resolve integration issues from chord visualization wiring"
```

- [ ] **Step 5: Final commit with all chord visualization complete**

```bash
git add -A
git commit -m "feat(chord): complete chord visualization feature"
```
