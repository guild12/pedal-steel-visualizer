# Alternative Chord Selection — Design Spec

**Date:** 2026-03-25
**Status:** Draft

## Summary

Make alternative chord interpretations in the ChordAnalyzerBadge clickable. Selecting an alternative promotes it to the primary display and recolors the fretboard based on that chord's root and quality. Clicking again reverts to the auto-detected chord.

## Motivation

Chord detection picks the highest-scoring interpretation, but steel players often hear a different voicing. Being able to select an alternative chord and immediately see it reflected on the fretboard — colored by the active theme — makes the tool more useful for exploring harmonic possibilities.

## Behavior

### Selecting an Alternative
- Expand the badge (click to show "Also" section, same as today).
- Click any alternative chord name in the "Also" list.
- That chord becomes the **displayed chord** (large text at top of badge).
- The original auto-detected primary moves into the "Also" list in its place.
- The fretboard recolors based on the selected chord's root and quality, using the active color theme.

### Reverting to Auto-Detected
- Click the currently promoted chord name (the large text) to revert to auto-detected.
- OR: the override auto-resets whenever the detection changes (fret change, pedal/lever toggle, copedent switch).

### Visual Indicators
- Alternative chord names in the "Also" section get a hover style (pointer cursor, subtle highlight) to signal they're clickable.
- When an override is active, show a small label like `"(selected)"` next to the large chord name so the user knows they're viewing a manual pick, not the auto-detected result.
- The original auto-detected chord appears in the "Also" list with a label like `"(detected)"` so it's easy to find and revert to.

## Data Flow

### Override State
New state in `App.tsx`:

```typescript
const [overrideChord, setOverrideChord] = useState<ChordName | null>(null);
```

Where `ChordName` is the existing type: `{ root: string; quality: string; display: string }`.

**Auto-reset:** When `currentDetection` changes (identity, not deep equality — the useMemo already produces a new object), clear the override:

```typescript
useEffect(() => {
  setOverrideChord(null);
}, [currentDetection]);
```

### Active Chord
Derive the chord used for display and coloring:

```typescript
const activeChord = overrideChord ?? currentDetection?.primary ?? null;
```

### chordNotesMap Update
The existing `chordNotesMap` useMemo currently reads `currentDetection.primary.root` and `.quality` to compute function labels. Change it to use `activeChord.root` and `activeChord.quality` instead. Add `activeChord` to the dependency array.

When `overrideChord` is set:
- `getChordTones(activeChord.root, activeChord.quality)` produces the core tones for the selected alternative.
- Extensions from `currentDetection.layers.extensions` are **not used** — the override chord's core tones are all we can derive (we don't have extension data for alternatives since detection only scores them, it doesn't re-analyze layers per alternative).

### Badge Props
Add callback:

```typescript
onChordOverride?: (chord: ChordName | null) => void;
overrideChord?: ChordName | null;
```

The badge uses these to:
1. Determine which chord to display as primary (override ?? detection.primary).
2. Build the "Also" list: if override is set, swap the original primary into alternatives and remove the override from alternatives.
3. Call `onChordOverride(alt)` when an alternative is clicked.
4. Call `onChordOverride(null)` when the promoted chord is clicked to revert.

### Color Resolution
No changes needed to color resolution. The fretboard already colors based on `chordNotesMap`, which will now reflect the active chord (override or detected). The badge already uses `resolveChordColor('root', colorTheme)` for the chord name color, which works regardless of which chord is displayed.

## UI Details

### Alternative Items (expanded badge)
Current:
```
Also:
C#min
Amaj
```

New:
```
Also:
C#min     ← cursor:pointer, hover:text-gray-200
Amaj      ← cursor:pointer, hover:text-gray-200
```

When override is active:
```
Also:
Emaj (detected)    ← the original, click to revert
Amaj               ← another alternative
```

### Primary Display When Overridden
```
CHORD AT FRET 3
C#min (selected)   ← large text, with subtle indicator
+9
```

The `(selected)` / `(detected)` labels are small, gray, and unobtrusive — just enough to communicate state.

### Click Target Separation
Currently the entire badge `<div>` has an `onClick` that toggles expand/collapse. With this feature:
- The **outer div click** still toggles expand/collapse.
- **Alternative items** in the "Also" list get their own `onClick` with `e.stopPropagation()` to prevent toggling collapse when selecting an alternative.
- **Clicking the large chord name to revert** (when override is active): add a separate click handler on the chord name `<span>` with `e.stopPropagation()`. This reverts the override without collapsing the badge, so the user can continue browsing alternatives.

## Files Changed

1. **`src/App.tsx`** — add `overrideChord` state, derive `activeChord`, update `chordNotesMap` to use `activeChord`, pass override props to badge
2. **`src/components/ChordVisualization/ChordAnalyzerBadge.tsx`** — accept override props, make alternatives clickable, swap display logic, add visual indicators
3. **`src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`** — test click-to-promote, click-to-revert, visual indicators

## Files NOT Changed

- Color theme system (resolveChordColor, ColorThemeSelector, etc.)
- Chord detection logic
- NoteIndicators, Fretboard — they already consume chordNotesMap
- ControlPanel

## Testing

- Click alternative → it becomes the primary display
- Fretboard recolors to reflect the alternative chord's tones
- Click promoted chord → reverts to auto-detected
- Change fret → override resets automatically
- Press pedal → override resets automatically
- "(selected)" label visible when override active
- "(detected)" label on original primary in "Also" list when overridden
- Hover style on alternatives signals clickability
