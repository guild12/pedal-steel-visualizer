# Move-To Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a position-anchored "Move To" mode that, from the player's live fretboard position, draws every voicing of a chosen target chord on the fretboard ranked by move-effort, lets the player inspect one, and commits it by driving the live bar position + engaged controls.

**Architecture:** A third mutually-exclusive mode alongside Chord Finder and Transitions. The existing effort math is generalized into an exported `scoreMove(from, to)`; the existing `findVoicings` supplies target candidates; a new fretboard overlay (`MoveToOverlay`) renders ranked ghost tone-bars; a new panel (`MoveToPanel`) lists/inspects moves and commits them via a new `setControls` action plus the existing `selectFret`. Source = live `selectedFret ?? 0` + `engagedControls`.

**Tech Stack:** React 19 + TypeScript (strict), Vite, Vitest + Testing Library, Tailwind CSS 4, SVG fretboard rendering.

**Spec:** `docs/superpowers/specs/2026-05-27-move-to-navigator-design.md`

---

## File Structure

- `src/types/chordTypes.ts` — add `EffortPosition`, `ScoredMove`, `MoveToState` types (modify).
- `src/utils/transitionScoring.ts` — extract/export `scoreMove(from, to)`; refactor `findTransitions` to use it (modify).
- `src/utils/transitionScoring.test.ts` — add `scoreMove` tests (modify).
- `src/utils/moveToColors.ts` — ease bucketing + color (create).
- `src/utils/moveToColors.test.ts` — tests (create).
- `src/hooks/useCopedentState.ts` — add `setControls` (modify).
- `src/hooks/useCopedentState.test.ts` — add `setControls` test (modify).
- `src/hooks/useChordState.ts` — add `moveTo` state + actions (modify).
- `src/hooks/useChordState.test.ts` — add `moveTo` tests (modify).
- `src/components/ChordVisualization/MoveToOverlay.tsx` — ranked ghost-bar overlay (create).
- `src/components/ChordVisualization/MoveToPanel.tsx` — list/inspect/commit panel (create).
- `src/components/ChordVisualization/MoveToPanel.test.tsx` — panel commit test (create).
- `src/components/Fretboard/Fretboard.tsx` — render `MoveToOverlay` via new props (modify).
- `src/components/ControlPanel/ControlPanel.tsx` — add "Move To" toggle button (modify).
- `src/App.tsx` — wire mode: source position, `moveResults` memo, picker/overlay/panel, commit (modify).

---

## Task 1: Generalize effort scoring into `scoreMove`

**Files:**
- Modify: `src/types/chordTypes.ts`
- Modify: `src/utils/transitionScoring.ts`
- Test: `src/utils/transitionScoring.test.ts`

- [ ] **Step 1: Add the `EffortPosition` and `ScoredMove` types**

In `src/types/chordTypes.ts`, after the `TransitionResult` interface (line 67), add:

```typescript
/** Minimal shape needed to score a move: a fret, engaged controls, and per-string pitch classes. */
export interface EffortPosition {
  fret: number;
  engagedControls: string[];
  notes: { pitchClass: string }[];
}

/** A candidate target voicing paired with the effort to reach it from the current position. */
export interface ScoredMove {
  target: VoicingResult;
  effort: TransitionEffort;
}
```

Note: `VoicingResult` already has `fret`, `engagedControls`, and `notes: VoicingNote[]` (and `VoicingNote` has `pitchClass`), so any `VoicingResult` is structurally assignable to `EffortPosition`.

- [ ] **Step 2: Write the failing test for `scoreMove`**

In `src/utils/transitionScoring.test.ts`, add (keep existing imports; add `scoreMove` to the import from `./transitionScoring`):

```typescript
import { scoreMove } from './transitionScoring';

describe('scoreMove', () => {
  it('scores a zero-bar-move pedal press (the "just press A" case)', () => {
    const from = { fret: 3, engagedControls: [], notes: [{ pitchClass: 'E' }, { pitchClass: 'B' }] };
    const to = { fret: 3, engagedControls: ['A'], notes: [{ pitchClass: 'E' }, { pitchClass: 'C#' }] };
    const effort = scoreMove(from, to);
    expect(effort.fretDistance).toBe(0);
    expect(effort.controlChanges).toEqual([{ control: 'A', action: 'press' }]);
    expect(effort.commonTones).toBe(1); // E matches by string index; B vs C# does not
    expect(effort.totalScore).toBe(3); // 0*10 + 1*5 - 1*2
  });

  it('counts bar distance and releases', () => {
    const from = { fret: 1, engagedControls: ['A', 'B'], notes: [{ pitchClass: 'F' }] };
    const to = { fret: 6, engagedControls: ['A'], notes: [{ pitchClass: 'A#' }] };
    const effort = scoreMove(from, to);
    expect(effort.fretDistance).toBe(5);
    expect(effort.controlChanges).toEqual([{ control: 'B', action: 'release' }]);
    expect(effort.commonTones).toBe(0);
    expect(effort.totalScore).toBe(55); // 5*10 + 1*5 - 0
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- transitionScoring`
Expected: FAIL — `scoreMove is not a function` / not exported.

- [ ] **Step 4: Implement `scoreMove` and refactor `findTransitions` to use it**

Replace the entire contents of `src/utils/transitionScoring.ts` with:

```typescript
import type { Copedent } from '../types';
import type {
  TransitionResult,
  TransitionEffort,
  ControlChange,
  EffortPosition,
} from '../types/chordTypes';
import { findVoicings } from './voicingSearch';

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
      const effort = scoreMove(from, to);
      results.push({ from, to, effort });
    }
  }

  results.sort((a, b) => a.effort.totalScore - b.effort.totalScore);
  return results.slice(0, maxResults);
}

/** Effort to move from one position/voicing to another. Lower totalScore = easier. */
export function scoreMove(from: EffortPosition, to: EffortPosition): TransitionEffort {
  const fretDistance = Math.abs(from.fret - to.fret);

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

  let commonTones = 0;
  for (let i = 0; i < from.notes.length && i < to.notes.length; i++) {
    if (from.notes[i].pitchClass === to.notes[i].pitchClass) {
      commonTones++;
    }
  }

  const totalScore =
    fretDistance * 10 +
    controlChanges.length * 5 -
    commonTones * 2;

  return { fretDistance, controlChanges, commonTones, totalScore };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- transitionScoring`
Expected: PASS (new `scoreMove` tests + existing transition tests still green).

- [ ] **Step 6: Commit**

```bash
git add src/types/chordTypes.ts src/utils/transitionScoring.ts src/utils/transitionScoring.test.ts
git commit -m "refactor(transitions): extract reusable scoreMove from calculateEffort"
```

---

## Task 2: Ease bucketing + color util

**Files:**
- Create: `src/utils/moveToColors.ts`
- Test: `src/utils/moveToColors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/moveToColors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { bucketEase, easeColor } from './moveToColors';

describe('bucketEase', () => {
  it('buckets by totalScore thresholds', () => {
    expect(bucketEase(-2)).toBe('easy');
    expect(bucketEase(5)).toBe('easy');
    expect(bucketEase(6)).toBe('medium');
    expect(bucketEase(20)).toBe('medium');
    expect(bucketEase(21)).toBe('hard');
    expect(bucketEase(99)).toBe('hard');
  });
});

describe('easeColor', () => {
  it('maps buckets to the ease palette', () => {
    expect(easeColor('easy')).toBe('#7CFF6B');
    expect(easeColor('medium')).toBe('#FFB454');
    expect(easeColor('hard')).toBe('#FF6B6B');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- moveToColors`
Expected: FAIL — cannot find module `./moveToColors`.

- [ ] **Step 3: Implement the util**

Create `src/utils/moveToColors.ts`:

```typescript
// Ease coloring for Move-To ghost bars. These are intentionally a fixed,
// theme-independent green/amber/red triad: "ease" is a universal traffic-light
// semantic, not a note-function color, so it does not vary with colorTheme
// (which only governs note-dot coloring). Control-delta labels still use the
// per-control colors from controlColors.ts.
export type EaseBucket = 'easy' | 'medium' | 'hard';

export function bucketEase(totalScore: number): EaseBucket {
  if (totalScore <= 5) return 'easy';
  if (totalScore <= 20) return 'medium';
  return 'hard';
}

export function easeColor(bucket: EaseBucket): string {
  switch (bucket) {
    case 'easy': return '#7CFF6B';
    case 'medium': return '#FFB454';
    case 'hard': return '#FF6B6B';
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- moveToColors`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/moveToColors.ts src/utils/moveToColors.test.ts
git commit -m "feat(move-to): add ease bucketing + color util"
```

---

## Task 3: `setControls` action on copedent state

**Files:**
- Modify: `src/hooks/useCopedentState.ts`
- Test: `src/hooks/useCopedentState.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/hooks/useCopedentState.test.ts`, add a test inside the existing top-level `describe`:

```typescript
it('sets engaged controls wholesale via setControls', () => {
  const { result } = renderHook(() => useCopedentState());
  act(() => result.current.setControls(['A', 'B']));
  expect(result.current.engagedControls).toEqual(new Set(['A', 'B']));
  act(() => result.current.setControls([]));
  expect(result.current.engagedControls).toEqual(new Set());
});
```

(If `renderHook`/`act` are not already imported in this file, add `import { renderHook, act } from '@testing-library/react';`.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useCopedentState`
Expected: FAIL — `result.current.setControls is not a function`.

- [ ] **Step 3: Implement `setControls`**

In `src/hooks/useCopedentState.ts`, add this callback after `clearAllControls` (after line 45):

```typescript
  const setControls = useCallback((controls: string[]) => {
    setEngagedControls(new Set(controls))
  }, [])
```

Then add `setControls,` to the returned object (after the `clearAllControls,` line, around line 92):

```typescript
    toggleControl,
    clearAllControls,
    setControls,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useCopedentState`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCopedentState.ts src/hooks/useCopedentState.test.ts
git commit -m "feat(state): add setControls to set engaged controls wholesale"
```

---

## Task 4: `moveTo` mode state in `useChordState`

**Files:**
- Modify: `src/types/chordTypes.ts`
- Modify: `src/hooks/useChordState.ts`
- Test: `src/hooks/useChordState.test.ts`

- [ ] **Step 1: Add the `MoveToState` type**

In `src/types/chordTypes.ts`, after `ChordTransitionState` (line 81), add:

```typescript
export interface MoveToState {
  active: boolean;
  targetChord: { root: string; quality: string } | null;
  inspectedIndex: number | null;
}
```

- [ ] **Step 2: Write the failing tests**

In `src/hooks/useChordState.test.ts`, add inside the existing `describe`:

```typescript
it('initializes move-to as inactive', () => {
  const { result } = renderHook(() => useChordState());
  expect(result.current.moveTo).toBeNull();
});

it('activates move-to with a target and clears other modes', () => {
  const { result } = renderHook(() => useChordState());
  act(() => result.current.activateChordFinder('C', 'maj'));
  act(() => result.current.activateMoveTo('A', 'maj'));
  expect(result.current.moveTo!.active).toBe(true);
  expect(result.current.moveTo!.targetChord).toEqual({ root: 'A', quality: 'maj' });
  expect(result.current.moveTo!.inspectedIndex).toBeNull();
  expect(result.current.chordFinder).toBeNull();
});

it('inspects a move result', () => {
  const { result } = renderHook(() => useChordState());
  act(() => result.current.activateMoveTo('A', 'maj'));
  act(() => result.current.inspectMoveResult(2));
  expect(result.current.moveTo!.inspectedIndex).toBe(2);
});

it('deactivates move-to', () => {
  const { result } = renderHook(() => useChordState());
  act(() => result.current.activateMoveTo('A', 'maj'));
  act(() => result.current.deactivateMoveTo());
  expect(result.current.moveTo).toBeNull();
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- useChordState`
Expected: FAIL — `moveTo` / `activateMoveTo` undefined.

- [ ] **Step 4: Implement the moveTo state and actions**

In `src/hooks/useChordState.ts`:

Add `MoveToState` to the type import (line 2-5 block):

```typescript
import type {
  ChordFinderState,
  ChordTransitionState,
  MoveToState,
} from '../types/chordTypes';
```

Add state after `chordTransition` (after line 10):

```typescript
  const [moveTo, setMoveTo] = useState<MoveToState | null>(null);
```

In `activateChordFinder` add `setMoveTo(null);` and in `activateTransition` add `setMoveTo(null);` so they remain mutually exclusive (place alongside the existing `setChordFinder(null)`/`setChordTransition(null)` calls in each).

Add these callbacks after `deactivateTransition` (after line 51):

```typescript
  const activateMoveTo = useCallback((root: string, quality: string) => {
    setMoveTo({ active: true, targetChord: { root, quality }, inspectedIndex: null });
    setChordFinder(null);
    setChordTransition(null);
  }, []);

  const inspectMoveResult = useCallback((index: number) => {
    setMoveTo(prev => (prev ? { ...prev, inspectedIndex: index } : null));
  }, []);

  const deactivateMoveTo = useCallback(() => {
    setMoveTo(null);
  }, []);
```

Add to the returned object (after `deactivateTransition,`):

```typescript
    moveTo,
    activateMoveTo,
    inspectMoveResult,
    deactivateMoveTo,
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- useChordState`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/chordTypes.ts src/hooks/useChordState.ts src/hooks/useChordState.test.ts
git commit -m "feat(state): add move-to mode to useChordState"
```

---

## Task 5: `MoveToOverlay` fretboard component

**Files:**
- Create: `src/components/ChordVisualization/MoveToOverlay.tsx`

- [ ] **Step 1: Implement the overlay**

Create `src/components/ChordVisualization/MoveToOverlay.tsx`:

```typescript
import type { ScoredMove } from '../../types/chordTypes';
import { getFretX, TOTAL_FRETS } from '../../utils/fretUtils';
import { bucketEase, easeColor } from '../../utils/moveToColors';
import { getControlColor } from '../../utils/controlColors';

interface MoveToOverlayProps {
  moves: ScoredMove[];
  inspectedFret: number | null;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  onInspectFret: (fret: number) => void;
}

export function MoveToOverlay({
  moves,
  inspectedFret,
  fretboardWidth,
  fretboardHeight,
  leftMargin,
  onInspectFret,
}: MoveToOverlayProps) {
  // Keep only the easiest move per fret.
  const byFret = new Map<number, ScoredMove>();
  for (const m of moves) {
    const existing = byFret.get(m.target.fret);
    if (!existing || m.effort.totalScore < existing.effort.totalScore) {
      byFret.set(m.target.fret, m);
    }
  }

  const barWidth = Math.min((fretboardWidth / TOTAL_FRETS) * 0.95, 38);
  const r = barWidth / 2;

  return (
    <g>
      {Array.from(byFret.entries()).map(([fret, move]) => {
        const cx = leftMargin + getFretX(fret, fretboardWidth);
        const left = cx - r;
        const right = cx + r;
        const color = easeColor(bucketEase(move.effort.totalScore));
        const isInspected = inspectedFret === fret;
        const noBarMove = move.effort.fretDistance === 0;
        // Tone-bar shape: domed top, flat bottom (matches the selected-fret bar).
        const d = `M ${left} ${r} A ${r} ${r} 0 0 1 ${right} ${r} L ${right} ${fretboardHeight} L ${left} ${fretboardHeight} Z`;

        const presses = move.effort.controlChanges.filter(c => c.action === 'press').map(c => c.control);
        const releases = move.effort.controlChanges.filter(c => c.action === 'release').map(c => c.control);

        return (
          <g key={`move-${fret}`}>
            <path
              d={d}
              fill={color}
              fillOpacity={isInspected ? 0.22 : 0.1}
              stroke={color}
              strokeOpacity={isInspected ? 1 : 0.7}
              strokeWidth={isInspected ? 3 : 2}
              strokeLinejoin="round"
              strokeDasharray={noBarMove ? 'none' : '5,3'}
              className="cursor-pointer"
              onClick={() => onInspectFret(fret)}
            />
            <foreignObject
              x={cx - 45}
              y={fretboardHeight + 2}
              width={90}
              height={30}
              overflow="visible"
            >
              <div className="text-center leading-tight" style={{ pointerEvents: 'none' }}>
                {noBarMove && (
                  <div className="text-[7px] uppercase font-bold" style={{ color }}>no bar move</div>
                )}
                <div className="text-[8px] whitespace-nowrap">
                  {presses.map(c => (
                    <span key={`p-${c}`} style={{ color: getControlColor(c) }}>+{c} </span>
                  ))}
                  {releases.map(c => (
                    <span key={`r-${c}`} className="text-gray-500">-{c} </span>
                  ))}
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: PASS (no type errors). If `TOTAL_FRETS` is not exported from `fretUtils`, it is — confirmed at `src/utils/fretUtils.ts:1`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChordVisualization/MoveToOverlay.tsx
git commit -m "feat(move-to): add ranked ghost-bar fretboard overlay"
```

---

## Task 6: `MoveToPanel` list/inspect/commit component

**Files:**
- Create: `src/components/ChordVisualization/MoveToPanel.tsx`
- Test: `src/components/ChordVisualization/MoveToPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ChordVisualization/MoveToPanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoveToPanel } from './MoveToPanel';
import type { ScoredMove } from '../../types/chordTypes';

function makeMove(fret: number, controls: string[], totalScore: number): ScoredMove {
  return {
    target: { fret, engagedControls: controls, notes: [], score: { completeness: 1, simplicity: 1, combined: 1 } },
    effort: { fretDistance: fret, controlChanges: controls.map(c => ({ control: c, action: 'press' as const })), commonTones: 0, totalScore },
  };
}

describe('MoveToPanel', () => {
  it('inspecting and committing the selected move calls onCommit with that target', () => {
    const moves = [makeMove(3, ['A'], 5), makeMove(8, ['B'], 30)];
    const onInspect = vi.fn();
    const onCommit = vi.fn();
    render(
      <MoveToPanel moves={moves} inspectedIndex={0} onInspect={onInspect} onCommit={onCommit} />
    );
    // Clicking a row inspects it.
    fireEvent.click(screen.getByText(/Fret 8/));
    expect(onInspect).toHaveBeenCalledWith(1);
    // The inspected row (index 0) shows a Move here button that commits its target.
    fireEvent.click(screen.getByRole('button', { name: /move here/i }));
    expect(onCommit).toHaveBeenCalledWith(moves[0].target);
  });

  it('renders an empty state when there are no moves', () => {
    render(<MoveToPanel moves={[]} inspectedIndex={null} onInspect={() => {}} onCommit={() => {}} />);
    expect(screen.getByText(/no positions/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- MoveToPanel`
Expected: FAIL — cannot find module `./MoveToPanel`.

- [ ] **Step 3: Implement the panel**

Create `src/components/ChordVisualization/MoveToPanel.tsx`:

```typescript
import type { ScoredMove, VoicingResult } from '../../types/chordTypes';
import { bucketEase, easeColor } from '../../utils/moveToColors';

interface MoveToPanelProps {
  moves: ScoredMove[];
  inspectedIndex: number | null;
  onInspect: (index: number) => void;
  onCommit: (target: VoicingResult) => void;
}

export function MoveToPanel({ moves, inspectedIndex, onInspect, onCommit }: MoveToPanelProps) {
  if (moves.length === 0) {
    return <div className="text-gray-500 text-sm">No positions found for that chord.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {moves.map((move, i) => {
        const isInspected = inspectedIndex === i;
        const { target, effort } = move;
        const color = easeColor(bucketEase(effort.totalScore));
        const presses = effort.controlChanges.filter(c => c.action === 'press').map(c => `+${c.control}`);
        const releases = effort.controlChanges.filter(c => c.action === 'release').map(c => `-${c.control}`);
        const changeText = [...presses, ...releases].join(', ') || 'no pedal change';

        return (
          <div
            key={i}
            onClick={() => onInspect(i)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
              isInspected ? 'bg-gray-800 border' : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
            }`}
            style={isInspected ? { borderColor: color } : undefined}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <div className="text-sm font-mono" style={{ color }}>Fret {target.fret}</div>
            <div className="text-xs text-gray-400 flex-1">
              {effort.fretDistance === 0 ? 'no bar move' : `slide ${effort.fretDistance}`} · {changeText}
            </div>
            <div className="text-[10px] text-indigo-400">{effort.commonTones} held</div>
            {isInspected && (
              <button
                onClick={(e) => { e.stopPropagation(); onCommit(target); }}
                className="px-3 py-1 text-xs rounded font-bold text-gray-950"
                style={{ backgroundColor: color }}
              >
                Move here
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- MoveToPanel`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/ChordVisualization/MoveToPanel.tsx src/components/ChordVisualization/MoveToPanel.test.tsx
git commit -m "feat(move-to): add list/inspect/commit panel"
```

---

## Task 7: Wire Move-To into Fretboard, ControlPanel, and App

**Files:**
- Modify: `src/components/Fretboard/Fretboard.tsx`
- Modify: `src/components/ControlPanel/ControlPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Move-To overlay props to Fretboard**

In `src/components/Fretboard/Fretboard.tsx`:

Add the import after the `ChordFinderOverlay` import (line 10):

```typescript
import { MoveToOverlay } from '../ChordVisualization/MoveToOverlay'
import type { ScoredMove } from '../../types/chordTypes'
```

Add to `FretboardProps` (after `finderTargetChord`, line 22):

```typescript
  moveResults?: ScoredMove[] | null;
  moveInspectedFret?: number | null;
  onMoveInspectFret?: (fret: number) => void;
```

Add to the destructured params (line 33), before `colorTheme = 'chordTones'`:

```typescript
  moveResults = null, moveInspectedFret = null, onMoveInspectFret,
```

Render the overlay immediately after the Chord finder overlay block (after line 189, still inside the `translate` group):

```typescript
          {/* Move-To overlay */}
          {moveResults && moveResults.length > 0 && (
            <MoveToOverlay
              moves={moveResults}
              inspectedFret={moveInspectedFret}
              fretboardWidth={fretboardWidth}
              fretboardHeight={FRETBOARD_HEIGHT}
              leftMargin={LEFT_MARGIN}
              onInspectFret={(fret) => onMoveInspectFret?.(fret)}
            />
          )}
```

- [ ] **Step 2: Add the "Move To" toggle button to ControlPanel**

In `src/components/ControlPanel/ControlPanel.tsx`:

Add to `ControlPanelProps` (after `transitionActive?: boolean;`, line 21):

```typescript
  onMoveToToggle?: () => void;
  moveToActive?: boolean;
```

Add to the destructured params (line 29-30 area):

```typescript
  onChordFinderToggle, onTransitionToggle, onMoveToToggle,
  chordFinderActive = false, transitionActive = false, moveToActive = false,
```

Add the button right after the Transitions button (after line 93, the closing `</button>` of Transitions):

```typescript
          <button
            onClick={onMoveToToggle}
            className={`px-3 py-1 rounded text-sm ${
              moveToActive ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Move To
          </button>
```

- [ ] **Step 3: Wire App.tsx — imports, source position, moveResults memo**

In `src/App.tsx`:

Add imports after the `findTransitions` import (line 10):

```typescript
import { scoreMove } from './utils/transitionScoring'
```

Add after the `TransitionResults` import (line 16):

```typescript
import { MoveToPanel } from './components/ChordVisualization/MoveToPanel'
```

Add `ScoredMove` and `VoicingResult` to the chordTypes type import (line 18):

```typescript
import type { ChordName, ScoredMove, VoicingResult } from './types/chordTypes'
```

Add this memo right after the `transitionResults` memo (after line 100, i.e. after the `findTransitions(...)` block closes):

```typescript
  // Compute ranked moves from the live position to the target chord
  const moveResults = useMemo<ScoredMove[]>(() => {
    if (!chordState.moveTo?.targetChord) return [];
    const { root, quality } = chordState.moveTo.targetChord;
    const fret = chordState.selectedFret ?? 0;
    const source = {
      fret,
      engagedControls: [...state.engagedControls],
      notes: state.activeCopedent.strings.map(s => ({
        pitchClass: calculateFretNote(s.openNote, fret, s.changes, state.engagedControls),
      })),
    };
    const targets = findVoicings(root, quality, state.activeCopedent);
    return targets
      .map<ScoredMove>(target => ({ target, effort: scoreMove(source, target) }))
      .sort((a, b) => a.effort.totalScore - b.effort.totalScore);
  }, [
    chordState.moveTo?.targetChord,
    chordState.selectedFret,
    state.engagedControls,
    state.activeCopedent,
  ]);

  // Fret currently inspected in Move-To (for overlay highlight)
  const moveInspectedFret =
    chordState.moveTo?.inspectedIndex != null
      ? moveResults[chordState.moveTo.inspectedIndex]?.target.fret ?? null
      : null;

  // Commit a move: drive bar + engaged controls to the chosen voicing
  const handleMoveCommit = (target: VoicingResult) => {
    state.setControls(target.engagedControls);
    if (chordState.selectedFret !== target.fret) {
      chordState.selectFret(target.fret);
    }
  };
```

Note: `chordState.selectFret` toggles off if called with the already-selected fret, hence the guard.

- [ ] **Step 4: Wire App.tsx — render picker, overlay props, panel, toggle**

In `src/App.tsx`:

Add the Move-To picker right after the Transition Picker block (after line 185):

```tsx
        {/* Move-To Picker (above fretboard) */}
        {chordState.moveTo?.active && (
          <ChordPicker
            onChordSelect={(root, quality) => chordState.activateMoveTo(root, quality)}
            onClose={() => chordState.deactivateMoveTo()}
            selectedRoot={chordState.moveTo.targetChord?.root}
            selectedQuality={chordState.moveTo.targetChord?.quality}
          />
        )}
```

Add overlay props to the `<Fretboard ... />` element (after the `finderTargetChord={...}` prop, line 197):

```tsx
          moveResults={chordState.moveTo?.active ? moveResults : null}
          moveInspectedFret={moveInspectedFret}
          onMoveInspectFret={(fret) => {
            const idx = moveResults.findIndex(m => m.target.fret === fret);
            if (idx >= 0) chordState.inspectMoveResult(idx);
          }}
```

Add the Move-To panel right after the Transition Results block (after line 219):

```tsx
        {/* Move-To panel (below fretboard) */}
        {chordState.moveTo?.active && (
          <MoveToPanel
            moves={moveResults}
            inspectedIndex={chordState.moveTo.inspectedIndex}
            onInspect={(idx) => chordState.inspectMoveResult(idx)}
            onCommit={handleMoveCommit}
          />
        )}
```

Add the toggle wiring to the `<ControlPanel ... />` element (after `onTransitionToggle={...}` block, after line 246):

```tsx
          moveToActive={chordState.moveTo?.active ?? false}
          onMoveToToggle={() => {
            if (chordState.moveTo?.active) {
              chordState.deactivateMoveTo();
            } else {
              chordState.activateMoveTo('C', 'maj');
            }
          }}
```

- [ ] **Step 5: Typecheck + full test suite + lint**

Run: `npm run build && npm test && npm run lint`
Expected: build PASS (no type errors), all tests PASS, lint clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/Fretboard/Fretboard.tsx src/components/ControlPanel/ControlPanel.tsx src/App.tsx
git commit -m "feat(move-to): wire Move-To mode into App, Fretboard, and ControlPanel"
```

---

## Task 8: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the golden path**

In the browser:
1. Click a fret (e.g. 3) and engage a pedal or two to set a current position; confirm the chord badge updates.
2. Click **Move To** in the control panel. Confirm the chord picker appears above the fretboard and Chord Finder / Transitions are not simultaneously active.
3. Pick a target chord (e.g. the IV). Confirm ghost tone-bars appear across the fretboard, color-coded green→amber→red, with `+pedal` labels underneath and a "no bar move" badge on any same-fret option.
4. Confirm the panel below lists the same positions, easiest first.
5. Click a position to inspect — confirm the matching ghost bar highlights and a "Move here" button appears on that row.
6. Click **Move here** — confirm the bar moves to that fret, the ControlPanel pedal/lever buttons light up to match, and the chord badge now reads the target chord.
7. Confirm the mode stays open and the rankings recompute from the new position (the previously-target chord may now show "no bar move" as easiest).

- [ ] **Step 3: Verify edge cases**

1. Pick a chord with no valid voicing within range (if any) — confirm the panel shows "No positions found for that chord." and no overlay renders.
2. Toggle Move To off — confirm overlay + picker + panel disappear and the fretboard returns to normal.
3. Switch to Chord Finder, then back to Move To — confirm clean mode switching with no stale overlay.

- [ ] **Step 4: Report**

Confirm in writing which checks passed. If any visual issue appears (overlapping labels, unreadable colors against the active theme), note it; small spacing fixes to `MoveToOverlay` label positioning are in scope.

---

## Self-Review Notes

- **Spec coverage:** source = live position (Task 7 memo); absolute target entry via ChordPicker (Task 7); ranked on-fretboard ghost bars (Tasks 2, 5); inspect + "Move here" commit driving live state (Tasks 3, 6, 7); living mode that recomputes (Task 7 memo deps + mode stays active on commit); third mutually-exclusive mode (Task 4). Deferred items (animation, roman-numeral entry, auto-routing) are intentionally absent.
- **Ease-color/theme open question:** resolved by decision in Task 2 — ease uses a fixed semantic green/amber/red triad (documented in `moveToColors.ts`); control labels use existing per-control colors. Note for review in Task 8 step 4 if any clash with the active theme.
- **Type consistency:** `EffortPosition`, `ScoredMove`, `MoveToState` defined in Task 1/4 and used consistently; `scoreMove(from, to)`, `setControls(controls)`, `activateMoveTo/inspectMoveResult/deactivateMoveTo` names match across tasks.
