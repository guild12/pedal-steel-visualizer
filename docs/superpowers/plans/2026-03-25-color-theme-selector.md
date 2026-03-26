# Color Theme Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a color theme selector dropdown to the Control Panel that lets users choose between three chord-coloring modes: Chord Tones (2-color, current default), Root Focus (3-color), and Per Function (5-color).

**Architecture:** Add a `ColorTheme` type and `resolveChordColor()` function that maps chord function labels to colors per theme. Refactor the chord notes map from `'core'|'extension'` roles to actual function labels (e.g., `'root'`, `'3rd'`, `'5th'`). Thread `colorTheme` state through App → Fretboard → NoteIndicators and ChordAnalyzerBadge via props. Add the dropdown + info popover to ControlPanel.

**Tech Stack:** React, TypeScript, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-25-color-theme-selector-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types.ts` | Modify | Add `ColorTheme` type |
| `src/utils/chordFunctionColors.ts` | Modify | Add `resolveChordColor()` with theme palette maps |
| `src/utils/chordFunctionColors.test.ts` | Create | Tests for `resolveChordColor()` |
| `src/hooks/useCopedentState.ts` | Modify | Add `colorTheme` state with localStorage persistence |
| `src/App.tsx` | Modify | Build function-label map instead of core/extension map, pass `colorTheme` down |
| `src/components/Fretboard/Fretboard.tsx` | Modify | Accept and pass through `colorTheme` prop |
| `src/components/Fretboard/NoteIndicators.tsx` | Modify | Use `resolveChordColor()` instead of hardcoded colors |
| `src/components/ChordVisualization/ChordAnalyzerBadge.tsx` | Modify | Use theme-resolved colors |
| `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx` | Modify | Update color assertions for theme support |
| `src/components/ControlPanel/ControlPanel.tsx` | Modify | Accept and pass through `colorTheme` + `onColorThemeChange` props |
| `src/components/ControlPanel/ColorThemeSelector.tsx` | Create | Dropdown + info popover component |
| `src/components/ControlPanel/ColorThemeSelector.test.tsx` | Create | Tests for dropdown and popover behavior |

---

## Task 1: Add `ColorTheme` Type

**Files:**
- Modify: `src/types.ts:20` (after `NoteDisplayMode`)

- [ ] **Step 1: Add type definition**

Add below the `NoteDisplayMode` type on line 20:

```typescript
export type ColorTheme = 'chordTones' | 'rootFocus' | 'perFunction';
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(theme): add ColorTheme type"
```

---

## Task 2: Add `resolveChordColor()` to chordFunctionColors

**Files:**
- Create: `src/utils/chordFunctionColors.test.ts`
- Modify: `src/utils/chordFunctionColors.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/chordFunctionColors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveChordColor } from './chordFunctionColors';

describe('resolveChordColor', () => {
  describe('chordTones theme (2-color)', () => {
    const theme = 'chordTones' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 3rd (core tone)', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 5th (core tone)', () => {
      expect(resolveChordColor('5th', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 6th (core tone)', () => {
      expect(resolveChordColor('6th', theme)).toBe('#00E5D0');
    });

    it('returns cyan for b7 (core tone)', () => {
      expect(resolveChordColor('b7', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 7th (core tone)', () => {
      expect(resolveChordColor('7th', theme)).toBe('#00E5D0');
    });

    it('returns orange for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#F4A261');
    });

    it('returns orange for #11 (extension)', () => {
      expect(resolveChordColor('#11', theme)).toBe('#F4A261');
    });

    it('returns orange for 13 (extension)', () => {
      expect(resolveChordColor('13', theme)).toBe('#F4A261');
    });

    it('returns null for null input (non-chord)', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('rootFocus theme (3-color)', () => {
    const theme = 'rootFocus' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns periwinkle for 3rd', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 5th', () => {
      expect(resolveChordColor('5th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 6th', () => {
      expect(resolveChordColor('6th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 7th', () => {
      expect(resolveChordColor('7th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b3', () => {
      expect(resolveChordColor('b3', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b7', () => {
      expect(resolveChordColor('b7', theme)).toBe('#7B8CDE');
    });

    it('returns orange for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#F4A261');
    });

    it('returns null for null input', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('perFunction theme (5-color)', () => {
    const theme = 'perFunction' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns red for 3rd', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#e63946');
    });

    it('returns red for b3', () => {
      expect(resolveChordColor('b3', theme)).toBe('#e63946');
    });

    it('returns periwinkle for 5th', () => {
      expect(resolveChordColor('5th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b5', () => {
      expect(resolveChordColor('b5', theme)).toBe('#7B8CDE');
    });

    it('returns orange for 7th', () => {
      expect(resolveChordColor('7th', theme)).toBe('#F4A261');
    });

    it('returns orange for 6th', () => {
      expect(resolveChordColor('6th', theme)).toBe('#F4A261');
    });

    it('returns purple for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#9b59b6');
    });

    it('returns purple for #11 (extension)', () => {
      expect(resolveChordColor('#11', theme)).toBe('#9b59b6');
    });

    it('returns purple for 13 (extension)', () => {
      expect(resolveChordColor('13', theme)).toBe('#9b59b6');
    });

    it('returns null for null input', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('unknown function labels', () => {
    it('falls back to extension color for unknown label in chordTones', () => {
      expect(resolveChordColor('unknown', 'chordTones')).toBe('#F4A261');
    });

    it('falls back to extension color for unknown label in rootFocus', () => {
      expect(resolveChordColor('unknown', 'rootFocus')).toBe('#F4A261');
    });

    it('falls back to purple for unknown label in perFunction', () => {
      expect(resolveChordColor('unknown', 'perFunction')).toBe('#9b59b6');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/chordFunctionColors.test.ts`
Expected: FAIL — `resolveChordColor` is not exported

- [ ] **Step 3: Implement `resolveChordColor()`**

In `src/utils/chordFunctionColors.ts`, first add the import at the **top** of the file (line 1):

```typescript
import type { ColorTheme } from '../types';
```

Then add the following **after** the existing `getChordFunctionColor` function (bottom of file):

```typescript
// Core tones: root, 3rd, b3, 5th, b5, #5, 6th, 7th, b7
const CORE_FUNCTIONS = new Set([
  'root', '3rd', 'b3', '5th', 'b5', '#5', '6th', '7th', 'b7',
]);

const CHORD_TONES_PALETTE = {
  core: '#00E5D0',     // cyan
  extension: '#F4A261', // orange
} as const;

const ROOT_FOCUS_PALETTE = {
  root: '#00E5D0',      // cyan
  core: '#7B8CDE',      // periwinkle
  extension: '#F4A261',  // orange
} as const;

/**
 * Resolve the display color for a chord function label under the given theme.
 * Returns null when chordFunction is null (non-chord notes — callers handle styling).
 */
export function resolveChordColor(
  chordFunction: string | null,
  theme: ColorTheme,
): string | null {
  if (chordFunction === null) return null;

  switch (theme) {
    case 'chordTones':
      return CORE_FUNCTIONS.has(chordFunction)
        ? CHORD_TONES_PALETTE.core
        : CHORD_TONES_PALETTE.extension;

    case 'rootFocus':
      if (chordFunction === 'root') return ROOT_FOCUS_PALETTE.root;
      return CORE_FUNCTIONS.has(chordFunction)
        ? ROOT_FOCUS_PALETTE.core
        : ROOT_FOCUS_PALETTE.extension;

    case 'perFunction':
      return CHORD_FUNCTION_COLORS[chordFunction] ?? '#9b59b6';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/chordFunctionColors.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/chordFunctionColors.ts src/utils/chordFunctionColors.test.ts
git commit -m "feat(theme): add resolveChordColor() with 3-theme palette support"
```

---

## Task 3: Add `colorTheme` State to `useCopedentState`

**Files:**
- Modify: `src/hooks/useCopedentState.ts:1-11, 72-89`

- [ ] **Step 1: Add colorTheme state with localStorage persistence**

In `src/hooks/useCopedentState.ts`, add after line 10 (`const [selectedKey, setSelectedKey] = useState('C')`):

```typescript
const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
  const saved = localStorage.getItem('psv-colorTheme');
  return (saved === 'chordTones' || saved === 'rootFocus' || saved === 'perFunction')
    ? saved : 'chordTones';
});
```

Add import at top:

```typescript
import type { Copedent, NoteDisplayMode, ColorTheme } from '../types'
```

Add persistence effect (after the existing copedents persistence effect around line 15):

```typescript
useEffect(() => {
  localStorage.setItem('psv-colorTheme', colorTheme);
}, [colorTheme]);
```

Add to the return object (after `setSelectedKey`):

```typescript
colorTheme,
setColorTheme,
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCopedentState.ts
git commit -m "feat(theme): add colorTheme state with localStorage persistence"
```

---

## Task 4: Refactor App.tsx — Function Labels Instead of Core/Extension

**Files:**
- Modify: `src/App.tsx:34-58, 161-178`

This task changes the `chordNotesMap` from mapping pitch classes to `'core'|'extension'` to mapping them to function labels like `'root'`, `'3rd'`, `'5th'`, etc. It also threads `colorTheme` down to child components.

**Important context:** `getChordTones()` returns **absolute** semitone values (e.g., E6 returns `[4, 8, 11, 1]` not `[0, 4, 7, 9]`). To get the correct function label, we must compute the **relative interval** from root: `(semitone - rootSemitone + 12) % 12`, then look up via `INTERVAL_TO_FUNCTION`. The `INTERVAL_TO_FUNCTION` import on line 12 of App.tsx is already present (previously unused).

- [ ] **Step 1: Refactor chordNotesMap to use function labels**

Replace the entire `chordNotesMap` useMemo block (lines 34-59) with:

```typescript
  // Compute chord notes map for coloring (pitch class → function label)
  // Function labels: 'root', '3rd', 'b3', '5th', '7th', '9', etc.
  const chordNotesMap = useMemo(() => {
    if (!currentDetection || chordState.selectedFret == null) return null;
    const map = new Map<string, string>();
    const rootSemitone = NOTE_NAMES.indexOf(currentDetection.primary.root as typeof NOTE_NAMES[number]);
    if (rootSemitone === -1) return null;

    // Core chord tones — compute relative interval from root to get function label
    const tones = getChordTones(currentDetection.primary.root, currentDetection.primary.quality);
    for (const semitone of tones) {
      const interval = (semitone - rootSemitone + 12) % 12;
      const fn = INTERVAL_TO_FUNCTION[interval];
      if (fn) {
        map.set(NOTE_NAMES[semitone % 12], fn);
      }
    }

    // Extension tones — use the interval prefix as function label
    for (const ext of currentDetection.layers.extensions) {
      const match = ext.match(/^([b#]?\d+)\s+\(([A-G]#?)\)/);
      if (match) {
        map.set(match[2], match[1]);
      }
    }

    return map;
  }, [currentDetection, chordState.selectedFret]);
```

This replaces all `'core'` / `'extension'` values with actual function labels.

- [ ] **Step 2: Pass `colorTheme` to Fretboard**

Update the `<Fretboard>` JSX (around line 161) to add:

```tsx
colorTheme={state.colorTheme}
```

- [ ] **Step 3: Pass `colorTheme` to ChordAnalyzerBadge**

Update the `<ChordAnalyzerBadge>` JSX (around line 174) to add:

```tsx
colorTheme={state.colorTheme}
```

- [ ] **Step 4: Pass `colorTheme` and `onColorThemeChange` to ControlPanel**

Update the `<ControlPanel>` JSX (around line 189) to add:

```tsx
colorTheme={state.colorTheme}
onColorThemeChange={state.setColorTheme}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: Errors about missing props on child components (expected — we'll fix those in subsequent tasks)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(theme): refactor chord map to function labels, thread colorTheme prop"
```

---

## Task 5: Update Fretboard.tsx — Accept and Pass Through `colorTheme`

**Files:**
- Modify: `src/components/Fretboard/Fretboard.tsx:2, 12-23, 32, 123-132`

- [ ] **Step 1: Add `colorTheme` to props interface and pass to NoteIndicators**

Add import at top (line 2):

```typescript
import type { Copedent, NoteDisplayMode, ColorTheme } from '../../types'
```

Add to `FretboardProps` interface (after `finderTargetChord`):

```typescript
colorTheme?: ColorTheme;
```

Add to destructured props (line 32):

```typescript
colorTheme = 'chordTones'
```

Add to `<NoteIndicators>` (after `chordNotes={chordNotes}`):

```tsx
colorTheme={colorTheme}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: Error about NoteIndicators not accepting `colorTheme` yet (expected)

- [ ] **Step 3: Commit**

```bash
git add src/components/Fretboard/Fretboard.tsx
git commit -m "feat(theme): pass colorTheme through Fretboard to NoteIndicators"
```

---

## Task 6: Update NoteIndicators.tsx — Use `resolveChordColor()`

**Files:**
- Modify: `src/components/Fretboard/NoteIndicators.tsx:1-61`

- [ ] **Step 1: Replace hardcoded colors with theme-resolved colors**

Replace the imports and constants at the top (lines 1-10):

```typescript
import React from 'react'
import type { StringConfig, NoteDisplayMode, ColorTheme } from '../../types'
import { calculateFretNote, getScaleDegree } from '../../utils/noteUtils'
import { getFretX, getStringY, TOTAL_FRETS } from '../../utils/fretUtils'
import { resolveChordColor } from '../../utils/chordFunctionColors'
```

Remove `CORE_COLOR` and `EXTENSION_COLOR` constants entirely.

Update the interface (add after `chordNotes`):

```typescript
colorTheme?: ColorTheme;
```

Update the comment on `chordNotes`:

```typescript
chordNotes?: Map<string, string> | null;  // pitch class → function label (e.g., 'root', '3rd', '9')
```

Update the destructured props to include `colorTheme = 'chordTones'`.

Replace the color logic block (lines 46-61):

```typescript
      const chordFunction = chordNotes?.get(activeNote) ?? null;
      const resolvedColor = resolveChordColor(chordFunction, colorTheme);
      let fillColor: string;
      let strokeColor: string;
      let textColor = '#fff';

      if (resolvedColor) {
        fillColor = resolvedColor;
        strokeColor = resolvedColor;
      } else {
        // Non-chord note, or no chord active
        fillColor = isHighlighted ? '#e63946' : '#1f2937';
        strokeColor = isHighlighted ? '#e63946' : '#4b5563';
      }
```

Update the `strokeWidth` in the circle element to use `chordFunction` instead of `chordRole`:

```tsx
strokeWidth={chordFunction ? 2 : 1}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors (or only ControlPanel-related ones)

- [ ] **Step 3: Commit**

```bash
git add src/components/Fretboard/NoteIndicators.tsx
git commit -m "feat(theme): NoteIndicators uses resolveChordColor for theme-aware coloring"
```

---

## Task 7: Update ChordAnalyzerBadge.tsx — Theme-Resolved Colors

**Files:**
- Modify: `src/components/ChordVisualization/ChordAnalyzerBadge.tsx:1-6, 8, 14, 35, 42, 58`
- Modify: `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`

- [ ] **Step 1: Update ChordAnalyzerBadge to use theme-resolved colors**

Replace the imports and constants (lines 1-6):

```typescript
import { useState } from 'react';
import type { ChordDetectionResult } from '../../types/chordTypes';
import type { ColorTheme } from '../../types';
import { resolveChordColor } from '../../utils/chordFunctionColors';
```

Remove `CORE_COLOR` and `EXTENSION_COLOR` constants.

Add to interface (after `hasEngagedControls`):

```typescript
colorTheme?: ColorTheme;
```

Add to destructured props:

```typescript
colorTheme = 'chordTones',
```

Replace the chord name color (line 35, the `style={{ color: CORE_COLOR }}`):

```tsx
<span className="text-lg font-bold" style={{ color: resolveChordColor('root', colorTheme) ?? '#00E5D0' }}>
```

Replace the extension label colors (line 42, the `style={{ color: EXTENSION_COLOR }}`):

```tsx
<span key={i} style={{ color: resolveChordColor(e.split(' ')[0], colorTheme) ?? '#F4A261' }}>
```

Replace the expanded extensions color (line 58, `style={{ color: EXTENSION_COLOR }}`):

```tsx
<span style={{ color: resolveChordColor(ext.split(' ')[0], colorTheme) ?? '#F4A261' }}>{ext}</span>
```

- [ ] **Step 2: Update test file**

In `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`, update the color assertion test (lines 35-41). The test "renders chord name in core color (cyan)" still passes because the default theme is `chordTones` and root resolves to cyan. But change the test name to reflect theme awareness:

```typescript
  it('renders chord name in root color (cyan) with default theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={true} />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });
```

Add a test for rootFocus theme:

```typescript
  it('renders chord name in cyan with rootFocus theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={true} colorTheme="rootFocus" />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ChordVisualization/ChordAnalyzerBadge.tsx src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx
git commit -m "feat(theme): ChordAnalyzerBadge uses resolveChordColor for theme-aware colors"
```

---

## Task 8: Create ColorThemeSelector Component

**Files:**
- Create: `src/components/ControlPanel/ColorThemeSelector.test.tsx`
- Create: `src/components/ControlPanel/ColorThemeSelector.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ControlPanel/ColorThemeSelector.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ColorThemeSelector } from './ColorThemeSelector';

describe('ColorThemeSelector', () => {
  it('renders dropdown with current theme selected', () => {
    const { getByRole } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    const select = getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('chordTones');
  });

  it('calls onChange when theme is selected', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={onChange} />
    );
    fireEvent.change(getByRole('combobox'), { target: { value: 'rootFocus' } });
    expect(onChange).toHaveBeenCalledWith('rootFocus');
  });

  it('shows info popover on info button click', () => {
    const { getByLabelText, getByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    fireEvent.click(getByLabelText('Color theme info'));
    expect(getByText(/Root stands out in cyan/)).toBeTruthy();
  });

  it('dismisses popover on second click', () => {
    const { getByLabelText, queryByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    const btn = getByLabelText('Color theme info');
    fireEvent.click(btn);
    expect(queryByText(/Root stands out in cyan/)).toBeTruthy();
    fireEvent.click(btn);
    expect(queryByText(/Root stands out in cyan/)).toBeFalsy();
  });

  it('dismisses popover on Escape key', () => {
    const { getByLabelText, queryByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    fireEvent.click(getByLabelText('Color theme info'));
    expect(queryByText(/Root stands out in cyan/)).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByText(/Root stands out in cyan/)).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ControlPanel/ColorThemeSelector.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ColorThemeSelector component**

Create `src/components/ControlPanel/ColorThemeSelector.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react';
import type { ColorTheme } from '../../types';

interface ColorThemeSelectorProps {
  colorTheme: ColorTheme;
  onChange: (theme: ColorTheme) => void;
}

const THEME_LABELS: Record<ColorTheme, string> = {
  chordTones: 'Chord Tones',
  rootFocus: 'Root Focus',
  perFunction: 'Per Function',
};

const THEME_DESCRIPTIONS: Record<ColorTheme, string> = {
  chordTones: 'Highlights notes in the chord vs. not. Core tones in cyan, extensions in orange.',
  rootFocus: 'Root stands out in cyan. Other chord tones in periwinkle, extensions in orange.',
  perFunction: 'Each chord degree gets its own color: root, 3rd, 5th, 7th, and extensions.',
};

export function ColorThemeSelector({ colorTheme, onChange }: ColorThemeSelectorProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [infoOpen]);

  return (
    <div className="flex items-center gap-2 relative" ref={popoverRef}>
      <span className="text-sm text-gray-400">Colors:</span>
      <select
        value={colorTheme}
        onChange={e => onChange(e.target.value as ColorTheme)}
        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
      >
        {(Object.keys(THEME_LABELS) as ColorTheme[]).map(t => (
          <option key={t} value={t}>{THEME_LABELS[t]}</option>
        ))}
      </select>
      <button
        aria-label="Color theme info"
        onClick={() => setInfoOpen(!infoOpen)}
        className="text-gray-500 hover:text-gray-300 text-sm leading-none"
      >
        (i)
      </button>

      {infoOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 w-72 shadow-lg">
          {(Object.keys(THEME_DESCRIPTIONS) as ColorTheme[]).map(t => (
            <div key={t} className="mb-2 last:mb-0">
              <div className="text-sm font-semibold text-white">{THEME_LABELS[t]}</div>
              <div className="text-xs text-gray-400">{THEME_DESCRIPTIONS[t]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ControlPanel/ColorThemeSelector.test.tsx`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ControlPanel/ColorThemeSelector.tsx src/components/ControlPanel/ColorThemeSelector.test.tsx
git commit -m "feat(theme): add ColorThemeSelector dropdown with info popover"
```

---

## Task 9: Wire ColorThemeSelector into ControlPanel

**Files:**
- Modify: `src/components/ControlPanel/ControlPanel.tsx:1-27, 88-94`

- [ ] **Step 1: Add props and render ColorThemeSelector**

Add imports at top:

```typescript
import type { NoteDisplayMode, ColorTheme } from '../../types'
import { ColorThemeSelector } from './ColorThemeSelector'
```

Add to `ControlPanelProps` interface (after `transitionActive`):

```typescript
colorTheme?: ColorTheme;
onColorThemeChange?: (theme: ColorTheme) => void;
```

Add to destructured props:

```typescript
colorTheme = 'chordTones', onColorThemeChange,
```

Add the `<ColorThemeSelector>` after `<DisplayOptions>` in the JSX (around line 88-93), inside the same flex container:

```tsx
{onColorThemeChange && (
  <ColorThemeSelector
    colorTheme={colorTheme}
    onChange={onColorThemeChange}
  />
)}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ControlPanel/ControlPanel.tsx
git commit -m "feat(theme): wire ColorThemeSelector into ControlPanel"
```

---

## Task 10: Final Integration Test

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Verify:
1. Color Theme dropdown appears in the Control Panel next to Display Options
2. Default "Chord Tones" shows cyan + orange (same as before)
3. Switching to "Root Focus" — root stays cyan, other chord tones become periwinkle
4. Switching to "Per Function" — root=cyan, 3rd=red, 5th=periwinkle, 7th/6th=orange, extensions=purple
5. Info (i) button opens popover with theme descriptions
6. Popover dismisses on click-outside and Escape
7. Theme persists after page reload (localStorage)
8. Non-chord notes stay dark gray regardless of theme
9. Pedal-changed non-chord notes stay red regardless of theme

- [ ] **Step 4: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "feat(theme): color theme selector — complete feature"
```
