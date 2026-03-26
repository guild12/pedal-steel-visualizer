# Alternative Chord Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make alternative chord names in the ChordAnalyzerBadge clickable — selecting one promotes it to the primary display and recolors the fretboard accordingly.

**Architecture:** Add `overrideChord` state in App.tsx that, when set, replaces the detected primary for both badge display and fretboard coloring via `chordNotesMap`. The badge handles the display swap (promoting the alternative, demoting the original into "Also") and calls back to App on click. Override auto-resets when detection changes.

**Tech Stack:** React, TypeScript, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-25-alternative-chord-selection-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/App.tsx` | Modify | Override state, activeChord derivation, chordNotesMap uses activeChord, pass override props to badge |
| `src/components/ChordVisualization/ChordAnalyzerBadge.tsx` | Modify | Clickable alternatives, display swap, visual indicators, stopPropagation |
| `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx` | Modify | Tests for click-to-promote, click-to-revert, indicators |

---

## Task 1: Update ChordAnalyzerBadge — Clickable Alternatives with Override Support

This is the core UI change. The badge accepts new props for override state and calls back to the parent when alternatives are clicked.

**Files:**
- Modify: `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
- Modify: `src/components/ChordVisualization/ChordAnalyzerBadge.tsx`

- [ ] **Step 1: Write failing tests for alternative selection**

Add these tests to `src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx` after the existing tests:

```typescript
  it('calls onChordOverride when alternative is clicked', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        onChordOverride={onOverride}
      />
    );
    // Expand to show alternatives
    fireEvent.click(getByText('Emaj'));
    // Click the alternative
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith({
      root: 'C#', quality: 'min', display: 'C#min',
    });
  });

  it('displays override chord as primary when overrideChord is set', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    // Override chord should be the large display
    expect(getByText('C#min')).toBeTruthy();
  });

  it('shows (selected) label when override is active', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    expect(getByText('(selected)')).toBeTruthy();
  });

  it('shows original primary with (detected) label in Also list when overridden', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    // Expand by clicking fret label (not chord name, which would revert)
    fireEvent.click(getByText('CHORD AT FRET 3'));
    expect(getByText('(detected)')).toBeTruthy();
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('badge expands when clicking non-chord-name area with override active', () => {
    const { getByText, queryByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    expect(queryByText('Also:')).toBeFalsy();
    fireEvent.click(getByText('CHORD AT FRET 3'));
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('calls onChordOverride(null) when clicking promoted chord to revert', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={onOverride}
      />
    );
    // Click the promoted chord name to revert
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith(null);
  });
```

Also add `vi` to the vitest import on line 1:

```typescript
import { describe, it, expect, vi } from 'vitest';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
Expected: FAIL — new tests fail because props don't exist yet

- [ ] **Step 3: Implement the updated ChordAnalyzerBadge**

Replace the entire content of `src/components/ChordVisualization/ChordAnalyzerBadge.tsx`:

```typescript
import { useState } from 'react';
import type { ChordDetectionResult, ChordName } from '../../types/chordTypes';
import type { ColorTheme } from '../../types';
import { resolveChordColor } from '../../utils/chordFunctionColors';

interface ChordAnalyzerBadgeProps {
  detection: ChordDetectionResult | null;
  fret: number | null;
  hasEngagedControls: boolean;
  colorTheme?: ColorTheme;
  overrideChord?: ChordName | null;
  onChordOverride?: (chord: ChordName | null) => void;
}

export function ChordAnalyzerBadge({
  detection,
  fret,
  hasEngagedControls,
  colorTheme = 'chordTones',
  overrideChord = null,
  onChordOverride,
}: ChordAnalyzerBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!detection) return null;

  const fretLabel = fret == null || fret === 0 ? 'OPEN STRINGS' : `CHORD AT FRET ${fret}`;
  const { primary, layers, alternatives } = detection;

  // Determine displayed chord: override wins over auto-detected
  const displayedChord = overrideChord ?? primary;
  const isOverridden = overrideChord !== null;

  // Build the "Also" list: swap original primary in when overridden
  const alsoList = isOverridden
    ? [
        // Original detected chord first, marked as (detected)
        { chord: primary, isDetected: true },
        // Remaining alternatives (exclude the override)
        ...alternatives
          .filter(alt => alt.display !== overrideChord.display)
          .slice(0, 2)
          .map(alt => ({ chord: alt as ChordName, isDetected: false })),
      ]
    : alternatives
        .slice(0, 3)
        .map(alt => ({ chord: alt as ChordName, isDetected: false }));

  return (
    <div
      className="inline-block rounded-lg border-2 border-gray-700 bg-gray-950 px-3 py-2 cursor-pointer min-w-[160px]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">
        {fretLabel}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-lg font-bold"
          style={{ color: resolveChordColor('root', colorTheme) ?? '#00E5D0' }}
          onClick={isOverridden && onChordOverride ? (e) => {
            e.stopPropagation();
            onChordOverride(null);
          } : undefined}
        >
          {displayedChord.display}
        </span>
        {isOverridden && (
          <span className="text-[10px] text-gray-500">(selected)</span>
        )}
        {!isOverridden && layers.extensions.length > 0 && (
          <span className="text-sm font-semibold flex gap-1.5">
            +
            {layers.extensions.map((e, i) => (
              <span key={i} style={{ color: resolveChordColor(e.split(' ')[0], colorTheme) ?? '#F4A261' }}>
                {e.split(' ')[0]}
              </span>
            ))}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {!isOverridden && layers.extensions.length > 0 && (
            <div className="text-xs mb-1">
              <span className="text-gray-500">Extensions: </span>
              {layers.extensions.map((ext, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-gray-600">, </span>}
                  <span style={{ color: resolveChordColor(ext.split(' ')[0], colorTheme) ?? '#F4A261' }}>{ext}</span>
                </span>
              ))}
            </div>
          )}
          {alsoList.length > 0 && (
            <div className="text-xs text-gray-500">
              <div className="mb-1">Also:</div>
              {alsoList.map((item, i) => (
                <div
                  key={i}
                  className="text-gray-400 hover:text-gray-200 cursor-pointer py-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onChordOverride) {
                      if (item.isDetected) {
                        // Clicking original detected chord reverts
                        onChordOverride(null);
                      } else {
                        // Promote this alternative — strip score field
                        const { root, quality, display } = item.chord;
                        onChordOverride({ root, quality, display });
                      }
                    }
                  }}
                >
                  {item.chord.display}
                  {item.isDetected && (
                    <span className="text-gray-600 ml-1">(detected)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

Key changes from the current version:
- New props: `overrideChord`, `onChordOverride`
- `displayedChord` derived from override ?? primary
- `alsoList` swaps original primary in when overridden, removes override from alternatives
- Alternative items get `onClick` with `e.stopPropagation()`
- Chord name gets click-to-revert handler when overridden (also with stopPropagation)
- `(selected)` / `(detected)` labels
- Extensions hidden when overridden (we don't have extension data for alternatives)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ChordVisualization/ChordAnalyzerBadge.tsx src/components/ChordVisualization/ChordAnalyzerBadge.test.tsx
git commit -m "feat(chord): clickable alternatives in badge with override display"
```

---

## Task 2: Wire Override State into App.tsx

Add `overrideChord` state, derive `activeChord`, update `chordNotesMap` to use it, and pass override props to the badge.

**Files:**
- Modify: `src/App.tsx:1, 17, 19-61, 177-182`

- [ ] **Step 1: Add import for ChordName type**

On line 17, add import for ChordName:

```typescript
import type { Copedent } from './types'
import type { ChordName } from './types/chordTypes'
```

- [ ] **Step 2: Add overrideChord state and auto-reset**

After line 23 (`const chordState = useChordState();`), add:

```typescript
  // Override chord selection — when user clicks an alternative in the badge
  const [overrideChord, setOverrideChord] = useState<ChordName | null>(null);

  // Auto-reset override when detection changes (fret change, pedal toggle, etc.)
  useEffect(() => {
    setOverrideChord(null);
  }, [currentDetection]);
```

- [ ] **Step 3: Derive activeChord and update chordNotesMap**

After the `currentDetection` useMemo and the new override state/effect, add:

```typescript
  // Active chord: override wins over auto-detected
  const activeChord = overrideChord ?? currentDetection?.primary ?? null;
```

Then update the `chordNotesMap` useMemo to use `activeChord` instead of `currentDetection.primary`. Replace the entire block (currently lines 34-61):

```typescript
  // Compute chord notes map for coloring (pitch class → function label)
  const chordNotesMap = useMemo(() => {
    if (!activeChord || chordState.selectedFret == null) return null;
    const map = new Map<string, string>();
    const rootSemitone = NOTE_NAMES.indexOf(activeChord.root as typeof NOTE_NAMES[number]);
    if (rootSemitone === -1) return null;

    // Core chord tones — compute relative interval from root to get function label
    const tones = getChordTones(activeChord.root, activeChord.quality);
    for (const semitone of tones) {
      const interval = (semitone - rootSemitone + 12) % 12;
      const fn = INTERVAL_TO_FUNCTION[interval];
      if (fn) {
        map.set(NOTE_NAMES[semitone % 12], fn);
      }
    }

    // Extension tones — only when showing the detected primary (not an override)
    if (!overrideChord && currentDetection) {
      for (const ext of currentDetection.layers.extensions) {
        const match = ext.match(/^([b#]?\d+)\s+\(([A-G]#?)\)/);
        if (match) {
          map.set(match[2], match[1]);
        }
      }
    }

    return map;
  }, [activeChord, overrideChord, currentDetection, chordState.selectedFret]);
```

**Key differences from old version:**
- Uses `activeChord.root` / `activeChord.quality` instead of `currentDetection.primary.*`
- Extension tones only included when no override (we don't have extension data for alternatives)
- Dependency array includes `activeChord` and `overrideChord`

- [ ] **Step 4: Pass override props to ChordAnalyzerBadge**

Update the `<ChordAnalyzerBadge>` JSX (around line 177) to add the new props:

```tsx
        <ChordAnalyzerBadge
          detection={currentDetection}
          fret={chordState.selectedFret}
          hasEngagedControls={state.engagedControls.size > 0}
          colorTheme={state.colorTheme}
          overrideChord={overrideChord}
          onChordOverride={setOverrideChord}
        />
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(chord): wire override state — alternative selection recolors fretboard"
```

---

## Task 3: Final Integration Verification

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
1. Select a fret → badge shows detected chord with "Also" alternatives
2. Expand badge → click an alternative → it becomes the large chord name with "(selected)" label
3. Fretboard recolors to reflect the alternative chord's tones
4. Original primary appears in "Also" list with "(detected)" label
5. Click promoted chord name → reverts to auto-detected, fretboard recolors back
6. Click "(detected)" chord in Also list → also reverts
7. Change fret → override resets, badge shows new auto-detected chord
8. Press pedal → override resets
9. Color theme selector still works with override active (changing themes recolors based on overridden chord)
10. Extensions only show when viewing auto-detected primary (hidden when override active)
