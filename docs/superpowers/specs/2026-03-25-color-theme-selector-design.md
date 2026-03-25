# Color Theme Selector — Design Spec

**Date:** 2026-03-25
**Status:** Draft

## Summary

Add a color theme selector to the Control Panel that lets users choose how chord tones are colored on the fretboard. Three themes available: Chord Tones (2-color), Root Focus (3-color), Per Function (5-color).

## Motivation

The current 2-color system (cyan for core, orange for extensions) is clean but doesn't distinguish root from 5th. Steel players think in chord functions — seeing the root pop out separately from the 3rd and 5th is valuable. But not everyone wants 5 colors. Making it a user choice gives everyone what they need.

## Theme Definitions

### Chord Tones (default — preserves current behavior)
- **Core tones** (root, 3rd, 5th, 6th, 7th): `#00E5D0` (cyan)
- **Extensions** (9, 11, 13, etc.): `#F4A261` (orange)
- **Non-chord**: `#1f2937` (dark gray), stroke `#4b5563`

### Root Focus
- **Root**: `#00E5D0` (cyan)
- **Core tones** (3rd, 5th, 6th, 7th): `#7B8CDE` (periwinkle)
- **Extensions** (9, 11, 13, etc.): `#F4A261` (orange)
- **Non-chord**: `#1f2937` (dark gray), stroke `#4b5563`

### Per Function
- **Root**: `#00E5D0` (cyan)
- **3rd / b3**: `#e63946` (red)
- **5th / b5 / #5**: `#7B8CDE` (periwinkle)
- **6th / 7th / b7**: `#F4A261` (orange)
- **Extensions** (9, b9, #9, 4th, 11, #11, 13): `#9b59b6` (purple)
- **Non-chord**: `#1f2937` (dark gray), stroke `#4b5563`

**Note:** In Per Function mode, red for 3rd and red for pedal-changed notes overlap. Pedal-changed notes that are also chord tones will show their chord function color (red for 3rd), which is acceptable since the pedal change is what produced the chord tone. Non-chord pedal-changed notes remain red as before.

## UI

### Control Panel Dropdown
- New dropdown in the Control Panel, same row/style as the existing display mode selector (Note Names / Scale Degrees).
- Label: "Color Theme" or just rendered as a dropdown with the theme name visible.
- Options: Chord Tones, Root Focus, Per Function.

### Info Popover
- Small `(i)` icon next to the dropdown.
- On click, shows a popover/tooltip with descriptions of all three themes:
  - **Chord Tones** — "Highlights notes in the chord vs. not. Core tones in cyan, extensions in orange."
  - **Root Focus** — "Root stands out in cyan. Other chord tones in periwinkle, extensions in orange."
  - **Per Function** — "Each chord degree gets its own color: root, 3rd, 5th, 7th, and extensions."
- Click again or click outside to dismiss. Dismiss on Escape key.
- Positioned below or beside the dropdown (implementer's choice based on available space).

## Data Flow

### Type
```typescript
type ColorTheme = 'chordTones' | 'rootFocus' | 'perFunction'
```

### State
- `colorTheme: ColorTheme` added to a new `useAppSettings` hook (separate from `useCopedentState`, which manages copedent data). This hook manages display preferences (`displayMode`, `selectedKey`, `colorTheme`) with localStorage persistence.
- Default: `'chordTones'` (preserves current behavior).

### Chord Notes Map — Change from Role to Function Labels
Currently `App.tsx` builds a `Map<string, string>` where the value is `'core' | 'extension'`. This needs to change to carry the **chord function label** (e.g., `'root'`, `'3rd'`, `'5th'`, `'9'`) so the color resolver can map it per theme.

New map type: `Map<string, string>` where value is the chord function label (e.g., `'root'`, `'3rd'`, `'b3'`, `'5th'`, `'7th'`, `'9'`, etc.).

**How to derive function labels:** Use `getIntervalLabel()` from `chordDictionary.ts` to convert each semitone offset from `getChordTones()` into its function label. `getIntervalLabel()` handles both standard intervals (mod 12 via `INTERVAL_TO_FUNCTION`) and extended intervals (13=b9, 14=9, 15=#9, 17=11, 18=#11, 21=13). The existing unused `INTERVAL_TO_FUNCTION` import in `App.tsx` was anticipating this refactor.

For extension tones currently parsed from display strings like `"9 (D)"`, continue extracting the note name but use the interval number prefix (e.g., `'9'`, `'b9'`) as the function label instead of `'extension'`.

**Edge case — `#9`:** `INTERVAL_TO_FUNCTION` maps semitone 3 to `'b3'`, not `'#9'`. The `#9` label only appears via `getIntervalLabel()` for extended interval 15. In chord detection, a note 3 semitones above root will be labeled `'b3'`. This is correct — enharmonically `#9` and `b3` are the same pitch, and in the context of chord function coloring, `b3` is the right label (it determines major/minor quality). The `CHORD_FUNCTION_COLORS` entry for `'#9'` serves as a fallback if an extension is explicitly labeled `#9` from detection layers.

### Color Resolver
New export from `chordFunctionColors.ts`:

```typescript
function resolveChordColor(chordFunction: string | null, theme: ColorTheme): string
```

This function takes a chord function label and the active theme, and returns the appropriate hex color. Each theme defines its own mapping:

- **chordTones**: root/3rd/5th/6th/7th → cyan (`#00E5D0`), extensions → orange (`#F4A261`)
- **rootFocus**: root → cyan (`#00E5D0`), 3rd/5th/6th/7th → periwinkle (`#7B8CDE`), extensions → orange (`#F4A261`)
- **perFunction**: uses the existing `CHORD_FUNCTION_COLORS` map directly

When `chordFunction` is `null`, the function returns `null` (callers handle non-chord styling themselves, since non-chord notes have separate fill/stroke logic and the highlighted-by-pedal case).

### ChordAnalyzerBadge Color Mapping
The badge displays the chord name and extension labels. With theme support:
- **Chord name** (e.g., "C6"): always uses the **root color** for the active theme (cyan in all three themes currently — but resolved via the theme so it stays consistent if colors change).
- **Extension labels** (e.g., "+9"): use `resolveChordColor()` with the extension's function label.

### Consumer Changes
- **NoteIndicators.tsx**: receives `colorTheme` prop. Calls `resolveChordColor(chordFunction, theme)` instead of checking `'core' | 'extension'`.
- **ChordAnalyzerBadge.tsx**: receives `colorTheme` prop. Uses root color for chord name, resolved colors for extension labels.
- **Fretboard.tsx**: accepts and passes through `colorTheme` prop to `NoteIndicators`.
- **App.tsx**: passes `colorTheme` down to Fretboard and ChordAnalyzerBadge. Builds the chord function map instead of the core/extension map.
- **ControlPanel.tsx**: receives `colorTheme` and `onColorThemeChange` props. Renders the new dropdown and info popover.

## Files Changed

1. **`src/types/index.ts`** — add `ColorTheme` type
2. **`src/utils/chordFunctionColors.ts`** — add `resolveChordColor()`, theme palette maps
3. **`src/hooks/useCopedentState.ts`** — extract `displayMode`, `selectedKey` into new `useAppSettings` hook (or add `colorTheme` alongside them in existing hook — minor refactor)
4. **`src/App.tsx`** — change chord notes map to use function labels via `getIntervalLabel()`, pass `colorTheme` down
5. **`src/components/Fretboard/Fretboard.tsx`** — accept and pass through `colorTheme` prop
6. **`src/components/Fretboard/NoteIndicators.tsx`** — use `resolveChordColor()` instead of hardcoded core/extension colors
7. **`src/components/ChordVisualization/ChordAnalyzerBadge.tsx`** — use theme-resolved colors
8. **`src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`** — update hardcoded color assertions (currently checks `rgb(0, 229, 208)`) to account for theme-dependent colors
9. **`src/components/ControlPanel/ControlPanel.tsx`** — add dropdown + info popover

## Files NOT Changed

- Chord detection logic (`chordDetection.ts`)
- Chord dictionary (`chordDictionary.ts`) — no changes needed, `getIntervalLabel()` already exists
- Fretboard layout (`FretLines.tsx`, `StringLines.tsx`, `FretMarkers.tsx`)
- Voicing search, transition scoring
- Fret selection highlight (stays cyan overlay)
- Pedal toggle buttons (stay red)

## Testing

- Each theme produces correct colors for a known chord (e.g., C6 = C, E, G, A → root=cyan, 3rd/5th/6th per theme)
- Theme persists across page reload (localStorage)
- Non-chord notes are always dark gray regardless of theme
- Pedal-changed non-chord notes remain red regardless of theme
- Info popover opens on click, dismisses on click-outside and Escape
- Existing `ChordAnalyzerBadge.test.tsx` updated to pass with theme-aware colors
