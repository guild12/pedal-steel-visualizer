# Chord Visualization Feature — Design Spec

**Date:** 2026-03-24
**Status:** Draft
**Project:** Pedal Steel Visualizer

## Overview

Add chord visualization capabilities to the pedal steel visualizer app. The feature has three primary modes that work together through the existing fretboard interface:

1. **Chord Analyzer** — identify what chord is being played at any fret with any combination of pedals/levers
2. **Chord Finder** — given a target chord, show all fret/pedal combinations where it can be played
3. **Chord Transitions** — given two chords, find the most efficient voicing pairs ranked by physical effort

All three modes integrate as overlays on the existing SVG fretboard. No separate views or mode-switching — the fretboard becomes interactive.

## Context: Pedal Steel Chord Voicing

Pedal steel guitar differs from standard guitar in how chords are voiced:

- Players use a bar across strings and pick with typically 2 fingers + thumb (some players use 3 fingers + thumb). The thumb can strum adjacent bass strings.
- Chord tones can be spread across non-adjacent strings — not limited to bar-adjacent voicings
- In a band context, steel players often voice only the defining tones of a chord (3rd, 7th, color tones) while the band covers root and 5th
- Copedents with many strings (up to 14) can produce complex extended chords when strummed with pedals/levers engaged
- The relationship between pedal/lever combinations and resulting chord qualities is core to the instrument's identity

### Physical Constraints on Controls

These constraints limit which pedal/lever combinations are physically possible and must be enforced by the voicing search to avoid suggesting unplayable voicings:

- **Pedals:** The right foot controls volume, so only the left foot operates pedals. A player can press at most 2 adjacent pedals simultaneously.
- **Knee levers (left side):** Only 1 left-side knee lever can be engaged at a time.
- **Knee levers (right side):** Only 1 right-side knee lever can be engaged at a time. Exception: vertical levers can sometimes be activated alongside an adjacent lever.
- **Combined:** A maximum realistic combination is 2 adjacent pedals + 1 left knee lever + 1 right knee lever.

These are defaults — advanced players or unusual setups may exceed them. The constraints should be configurable in a future iteration but enforced by default.

## 1. Chord Engine (`chordUtils.ts`)

A pure music theory module with no UI dependencies. Three capabilities:

### 1.1 Chord Detection

Given a set of pitch classes (notes without octave), identify the chord.

**Input:** Array of pitch classes (e.g., `['C', 'E', 'G', 'B', 'D', 'F#']`)

**Algorithm:**
- For each of the 12 possible root notes, compute the intervals relative to that root
- Match the interval set against a chord dictionary (see below)
- Score each match by: number of matched tones, whether a root is present, conventional likelihood
- Return results sorted by score

**Chord Dictionary** — interval patterns for recognized chord qualities:

| Quality | Intervals (semitones from root) |
|---------|-------------------------------|
| maj | 0, 4, 7 |
| min | 0, 3, 7 |
| dim | 0, 3, 6 |
| aug | 0, 4, 8 |
| 7 | 0, 4, 7, 10 |
| maj7 | 0, 4, 7, 11 |
| min7 | 0, 3, 7, 10 |
| dim7 | 0, 3, 6, 9 |
| m7b5 | 0, 3, 6, 10 |
| aug7 | 0, 4, 8, 10 |
| 6 | 0, 4, 7, 9 |
| min6 | 0, 3, 7, 9 |
| 9 | 0, 4, 7, 10, 14 |
| maj9 | 0, 4, 7, 11, 14 |
| min9 | 0, 3, 7, 10, 14 |
| 11 | 0, 4, 7, 10, 14, 17 |
| 13 | 0, 4, 7, 10, 14, 21 |
| 7#9 | 0, 4, 7, 10, 15 |
| 7b9 | 0, 4, 7, 10, 13 |
| 7#11 | 0, 4, 7, 10, 18 |
| maj7#11 | 0, 4, 7, 11, 18 |
| sus2 | 0, 2, 7 |
| sus4 | 0, 5, 7 |
| 7sus4 | 0, 5, 7, 10 |
| add9 | 0, 4, 7, 14 |

This dictionary is extensible — new qualities can be added without changing detection logic.

**Output structure:**

```typescript
interface ChordDetectionResult {
  /** Best interpretation */
  primary: ChordName;
  /** Layered breakdown of the primary */
  layers: ChordLayers;
  /** Alternative interpretations, scored and ranked */
  alternatives: ScoredChordName[];
}

interface ChordName {
  root: string;          // e.g., "C"
  quality: string;       // e.g., "maj7"
  display: string;       // e.g., "Cmaj7"
}

interface ChordLayers {
  core: string;          // e.g., "Cmaj7" (triad + 7th)
  extensions: string[];  // e.g., ["9 (D)", "#11 (F#)"]
}

interface ScoredChordName extends ChordName {
  score: number;         // higher = more likely interpretation
}
```

**Edge cases:**
- 1 note: no chord (just a note name)
- 2 notes: report the interval (e.g., "C-E = major 3rd") — can imply chord quality
- Incomplete chords (missing 5th): still detected, flagged as partial
- Notes that don't match any dictionary entry: report "unrecognized" with the pitch classes listed

### 1.2 Voicing Search

Given a target chord, find all fret + pedal/lever combinations that produce it on the current copedent.

**Input:** Target chord (root + quality), copedent data, fret range (default 0-11)

**Fret range:** Notes repeat every 12 frets on a steel guitar (fret 12 = open, fret 13 = fret 1, etc.), so analysis only needs to cover frets 0-11. Results can be displayed at higher frets by transposition, but the search space is just 12 positions.

**Algorithm:**
For each fret position (0-11):
  For each *physically valid* combination of pedals/levers (see Physical Constraints):
    1. Calculate the resulting note on every string
    2. Extract pitch classes (remove octaves)
    3. Check which target chord tones are present
    4. If at least the root + one defining tone (3rd or 7th) are present, record as a voicing

**Control combination filtering:** Rather than evaluating all 2^N combinations, generate only physically valid ones:
- Pedals: enumerate singles and adjacent pairs only
- Left knee levers: enumerate singles only
- Right knee levers: enumerate singles only (plus vertical lever adjacency exceptions)
- Cross-product these groups for all valid combinations
- This reduces a 2^12 (4,096) space to roughly 50-100 realistic combinations

**Additional pruning:**
- Only evaluate combinations where at least one control changes a string's note to a target chord tone
- Short-circuit when a complete voicing is found at a simpler combination

**Voicing scoring:**

```typescript
interface VoicingResult {
  fret: number;
  engagedControls: string[];      // which pedals/levers
  notes: VoicingNote[];           // per-string breakdown
  score: VoicingScore;
}

interface VoicingNote {
  stringNumber: number;
  note: string;                   // e.g., "C#4"
  chordFunction: string | null;   // "root", "3rd", "5th", "7th", "9", "#11", etc. Null if not a chord tone.
  isAlteredByControl: boolean;    // true if a pedal/lever changed this from the open note
  alteredBy: string | null;       // which control, e.g., "A" or "LKR"
}

interface VoicingScore {
  completeness: number;    // 0-1, what fraction of chord tones are present
  simplicity: number;      // 0-1, fewer controls = higher
  combined: number;        // weighted composite for ranking
}
```

### 1.3 Transition Scoring

Given two chords, find the best voicing pairs (one voicing for each chord) ranked by physical effort to move between them.

**Input:** Chord A, Chord B, copedent data

**Algorithm:**
1. Run voicing search for chord A → list of voicings
2. Run voicing search for chord B → list of voicings
3. For each pair (voicing A, voicing B), calculate transition cost:
   - **Fret distance:** `|fretA - fretB|` — 0 is ideal, weighted heavily
   - **Control changes:** number of pedals/levers that differ between the two voicings
   - **Common tones:** strings where the note doesn't change — more = smoother voice-leading
4. Rank pairs by total effort score (lower = better)
5. Return top N results (default 5)

**Output structure:**

```typescript
interface TransitionResult {
  from: VoicingResult;
  to: VoicingResult;
  effort: TransitionEffort;
}

interface TransitionEffort {
  fretDistance: number;
  controlChanges: ControlChange[];
  commonTones: number;
  totalScore: number;              // lower = easier
}

interface ControlChange {
  control: string;                 // e.g., "A", "LKR"
  action: 'press' | 'release';
}
```

## 2. Always-On Analyzer Badge

A floating badge in the upper-right corner of the fretboard area. Shows the detected chord for the current state.

### Behavior

- **No fret selected, no controls:** Shows chord implied by open strings (all strings at fret 0)
- **Fret selected, no controls:** Shows chord at that fret with open tuning
- **Controls engaged (any state):** Recalculates immediately. Badge border turns red (matching existing convention for altered notes)
- **Click badge:** Expands to show layered breakdown (core + extensions) and alternative interpretations

### Visual Design

- Compact: ~175px wide, ~50px tall
- Background: `#1a1a2e` (matches app dark theme)
- Border: `#00E5D0` (cyan) default, `#e63946` (red) when controls are engaged
- Content: "CHORD AT FRET X" label (small, gray) + chord name (large, colored) + extensions (smaller, periwinkle)

### State Updates

The badge reacts to:
- `engagedControls` changes (from the existing control panel)
- Selected fret changes (new: from clicking the fretboard)
- Copedent changes (switching copedents recalculates)

## 3. Fret Click Explorer

Clicking a fret on the fretboard selects it and triggers chord analysis.

### Interaction

1. **Click a fret region** (the space between two fret lines) → fret highlights with dashed cyan border
2. **Analyzer badge updates** to show the chord at that fret
3. **Notes at that fret light up** with chord function colors (see Section 5)
4. **Popover appears below the fret** with detailed breakdown:
   - Core chord name
   - Extensions listed separately
   - Alternative interpretations (clickable to expand)
5. **Click elsewhere or press Escape** → deselects fret, returns to default state
6. **Toggle pedals/levers while a fret is selected** → everything recalculates in real time

### Fret Selection State

New state addition to `AppState`:

```typescript
interface AppState {
  // ... existing fields
  selectedFret: number | null;    // null = no fret selected
}
```

## 4. Chord Finder

A chord picker UI that highlights matching frets on the fretboard.

### Chord Picker UI

Floating panel that opens from a button in the control panel area. Three input methods:

1. **Root selector:** 12-button grid (C through B), one selected at a time
2. **Quality selector:** Button grid of common qualities (maj, min, 7, maj7, min7, dim, aug, 9, min9, 13, m7b5, dim7, sus2, sus4, etc.)
3. **Text input:** Free-form field for exotic chords (e.g., "Cmaj9#11"). Parsed on Enter or blur.

Selecting root + quality (or typing a chord name) immediately triggers fretboard highlighting.

### Fretboard Highlighting

When a target chord is active:

- **Each fret where the chord is playable** gets a highlight overlay
- **Highlight intensity indicates voicing quality:**
  - Bright solid border (`#00E5D0`, full opacity) = complete chord, no pedals needed
  - Medium border = complete chord, needs pedals
  - Dim dashed border = partial chord or complex pedal requirements
- **Only chord tones light up** at highlighted frets — non-chord-tone strings stay dim
- **Chord function colors** applied to lit notes (see Section 5)
- **Pedal badges** appear below frets that require controls, showing which pedals/levers are needed
- **Click a highlighted fret** → selects it, shows full detail popover (same as Fret Click Explorer)

### Finder State

```typescript
interface AppState {
  // ... existing fields
  chordFinder: {
    active: boolean;
    targetChord: { root: string; quality: string } | null;
    results: VoicingResult[];     // from chord engine
  } | null;
}
```

### Bottom Legend Bar

When chord finder is active, a compact bar appears below the fretboard:
- Shows the searched chord name
- Legend for highlight intensities
- "Click a fret for details" hint

## 5. Chord Function Color System

When chord visualization is active (fret selected or chord finder engaged), notes are colored by their role in the detected/target chord.

### Color Mapping

| Chord Function | Color | Hex | Rationale |
|---------------|-------|-----|-----------|
| Root | Cyan | `#00E5D0` | Matches app's primary accent |
| 3rd | Red | `#e63946` | High importance — defines major/minor |
| 5th | Periwinkle | `#7B8CDE` | Supporting tone, less prominent |
| 7th | Orange | `#F4A261` | Warm color for harmonic color tone |
| Extensions (9, 11, 13, alterations) | Purple | `#9b59b6` | Distinct from core tones |
| Not in chord | Dim gray | `#444` | Visually recedes |

### Application

- Colors apply to the note indicator circles on the fretboard (replacing the current uniform gray or red)
- The note letter/name is still displayed inside each circle
- A small label below the note letter shows the chord function (e.g., "root", "3rd", "9")
- Colors are only active when a chord context exists (fret selected, finder active, or analyzer expanded). Default explore mode retains current coloring behavior.

### Color Legend

A compact legend appears when chord colors are active, showing the color-to-function mapping. Positioned near the analyzer badge or in the bottom bar.

## 6. Chord Transitions

Two-chord comparison that finds optimal voicing pairs.

### Transition Picker UI

Extends the chord finder with a "From → To" layout:

1. **"From" chord** (cyan border) — selected via same root+quality picker or text input
2. **Arrow indicator** between them
3. **"To" chord** (red border) — same picker, second selection
4. **Results summary** — "N voicing pairs found, ranked by ease of movement"

### Transition Results

Displayed as a ranked list of voicing pairs. Each result shows:

- **Chord A voicing:** fret position, pedals needed
- **Movement summary:**
  - Bar movement (fret distance, "none" if same fret)
  - Pedal/lever changes (which controls to press/release)
  - Common tones (how many strings don't change)
  - Overall effort rating
- **Chord B voicing:** fret position, pedals needed

### Fretboard Integration

Clicking a transition result highlights both voicings on the fretboard simultaneously:
- Chord A notes in cyan
- Chord B notes in red
- Common tones get a split/dual color indicator

### Transition State

```typescript
interface AppState {
  // ... existing fields
  chordTransition: {
    active: boolean;
    chordA: { root: string; quality: string } | null;
    chordB: { root: string; quality: string } | null;
    results: TransitionResult[];
    selectedResultIndex: number | null;
  } | null;
}
```

### Future Extension: Song Chart Mode

The transition engine is designed to later support multi-chord progressions:
- Input: sequence of chords (e.g., from a song chart)
- Output: optimal path through the progression, minimizing total movement
- This is noted as a future feature and not part of this initial implementation.

## 7. UI Integration

### New Components

| Component | Purpose |
|-----------|---------|
| `ChordAnalyzerBadge` | Always-on floating badge showing detected chord |
| `ChordDetailPopover` | Expanded breakdown when clicking badge or fret |
| `ChordPicker` | Root + quality selector + text input |
| `ChordFinderOverlay` | Fretboard highlights + bottom legend for finder mode |
| `TransitionPicker` | From→To chord selector |
| `TransitionResults` | Ranked voicing pair list |

### Modified Components

| Component | Changes |
|-----------|---------|
| `Fretboard` | Add click handler for fret selection, support highlight overlays |
| `NoteIndicators` | Support chord function coloring mode alongside existing modes |
| `ControlPanel` | Add "Chord Finder" and "Transitions" toggle buttons |
| `App` | Wire new state (selectedFret, chordFinder, chordTransition) |

### Layout

All chord features are overlays on the existing fretboard area:
- Analyzer badge: upper-right corner, floating
- Chord detail popover: below selected fret, floating
- Chord picker: above fretboard, floating (opened from control panel button)
- Transition picker: above fretboard, replaces chord picker when active
- Transition results: below fretboard, scrollable list
- Bottom legend bar: below fretboard when finder is active

### State Management

Extends the existing `useCopedentState` hook or adds a new `useChordState` hook:

```typescript
interface ChordState {
  selectedFret: number | null;
  chordFinder: {
    active: boolean;
    targetChord: { root: string; quality: string } | null;
    results: VoicingResult[];
  } | null;
  chordTransition: {
    active: boolean;
    chordA: { root: string; quality: string } | null;
    chordB: { root: string; quality: string } | null;
    results: TransitionResult[];
    selectedResultIndex: number | null;
  } | null;
}
```

This state is derived/computed — it doesn't persist to localStorage. The chord engine recalculates whenever inputs change (copedent, engaged controls, selected fret, target chord).

## 8. Performance Considerations

### Voicing Search Optimization

The search space is manageable thanks to two key constraints:

1. **Fret range is 0-11** — notes repeat every 12 frets, so only 12 positions need analysis
2. **Physical control constraints** reduce combinations from 2^N to ~50-100 valid combos (see Section "Physical Constraints on Controls")

For a typical E9 copedent: 12 frets x ~80 valid combos = ~960 evaluations (trivially fast).

**Additional mitigations:**
- Pre-filter control combinations: only evaluate combos where at least one control produces a target chord tone
- Cache results per copedent (copedent data changes rarely)
- Debounce recalculation on rapid pedal toggling (100ms)

### Transition Search

- Quadratic in number of voicings (voicings_A x voicings_B)
- Cap voicing lists at top 20 per chord before cross-matching
- Total pairs evaluated: max 400, which is fast

## 9. Testing Strategy

### Chord Engine (Unit Tests)

- Detection accuracy for all dictionary chord types
- Multi-interpretation ranking (Cmaj7 vs Em/C)
- Edge cases: 1-2 notes, all same note, chromatic clusters
- Voicing search: known voicings on E9 preset copedent
- Transition scoring: verify effort calculation math

### Component Tests

- ChordAnalyzerBadge renders correct chord for given state
- ChordPicker produces correct chord selection on click
- Fretboard click handler correctly identifies fret regions
- Chord function colors map correctly

### Integration Tests

- Full flow: select copedent → engage pedals → click fret → verify chord display
- Chord finder: select chord → verify correct frets highlight
- Transition: select two chords → verify results are correctly ranked
