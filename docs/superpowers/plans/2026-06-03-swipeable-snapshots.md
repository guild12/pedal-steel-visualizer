# Swipeable Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user keep multiple independent configurations ("snapshots") of the visualizer and two-finger swipe (plus dots/arrows) between them, each preserving its own copedent, bar position, pedals/levers, and display settings, persisted to localStorage.

**Architecture:** Approach A (serialize/restore). The existing hooks (`useCopedentState`, `useChordState`) remain the single *live* working state. A new `useSnapshots` data store holds an array of serialized `SnapshotState` blobs plus an `activeIndex`. Switching flushes the live state into the active slot, then hydrates the target slot back into the live hooks. Pure helpers (`snapshotOps`, `snapshotSync`) carry the tested logic; App composes them.

**Tech Stack:** React 19 + TypeScript (strict, no `any`), Vitest + Testing Library, localStorage.

**Spec:** `docs/superpowers/specs/2026-06-03-swipeable-snapshots-design.md`

---

## File Structure

- Create `src/types/snapshot.ts` — `SnapshotState` interface.
- Create `src/utils/snapshotOps.ts` (+ test) — pure array ops: `clampIndex`, `insertAfter`, `removeAt`.
- Create `src/utils/snapshotStorage.ts` (+ test) — versioned load/save with self-heal.
- Create `src/utils/snapshotSync.ts` (+ test) — `serializeLive`, `applySnapshot`, `makeDefaultSnapshot`.
- Create `src/hooks/useSnapshots.ts` (+ test) — store of `{ snapshots, activeIndex }`, persistence, `setAll`.
- Modify `src/hooks/useCopedentState.ts` (+ test) — add `setShowExtensions(bool)`.
- Modify `src/hooks/useChordState.ts` (+ test) — add non-toggling `setSelectedFret`.
- Create `src/hooks/useHorizontalSwipe.ts` (+ test) — trackpad/touch horizontal swipe detection.
- Create `src/components/SnapshotPager/SnapshotPager.tsx` (+ test) — dots, ‹ ›, +, delete.
- Modify `src/App.tsx` — orchestrate snapshots, mount pager, bind swipe, contain overscroll.

---

## Task 1: SnapshotState type

**Files:**
- Create: `src/types/snapshot.ts`

- [ ] **Step 1: Create the type**

```typescript
import type { NoteDisplayMode, ColorTheme } from './index'

/** One independent, serializable configuration of the visualizer. */
export interface SnapshotState {
  id: string
  activeCopedentId: string
  engagedControls: string[] // serialized form of the live Set<string>
  selectedFret: number | null
  displayMode: NoteDisplayMode
  selectedKey: string
  colorTheme: ColorTheme
  showExtensions: boolean
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (confirms `NoteDisplayMode` and `ColorTheme` are exported from `./index`).

- [ ] **Step 3: Commit**

```bash
git add src/types/snapshot.ts
git commit -m "feat(snapshots): add SnapshotState type"
```

---

## Task 2: Pure snapshot array ops

**Files:**
- Create: `src/utils/snapshotOps.ts`
- Test: `src/utils/snapshotOps.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { clampIndex, insertAfter, removeAt } from './snapshotOps'
import type { SnapshotState } from '../types/snapshot'

const snap = (id: string): SnapshotState => ({
  id,
  activeCopedentId: 'c1',
  engagedControls: [],
  selectedFret: null,
  displayMode: 'letters',
  selectedKey: 'C',
  colorTheme: 'chordTones',
  showExtensions: true,
})

describe('clampIndex', () => {
  it('clamps to valid range', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(5, 3)).toBe(2)
    expect(clampIndex(1, 3)).toBe(1)
  })
  it('returns 0 for empty length', () => {
    expect(clampIndex(0, 0)).toBe(0)
  })
})

describe('insertAfter', () => {
  it('inserts after index and selects the new item', () => {
    const arr = [snap('a'), snap('b')]
    const result = insertAfter(arr, 0, snap('x'))
    expect(result.snapshots.map(s => s.id)).toEqual(['a', 'x', 'b'])
    expect(result.activeIndex).toBe(1)
  })
})

describe('removeAt', () => {
  it('removes item and clamps index', () => {
    const arr = [snap('a'), snap('b'), snap('c')]
    const result = removeAt(arr, 2, () => snap('def'))
    expect(result.snapshots.map(s => s.id)).toEqual(['a', 'b'])
    expect(result.activeIndex).toBe(1)
  })
  it('replaces with a default when removing the only item', () => {
    const arr = [snap('a')]
    const result = removeAt(arr, 0, () => snap('def'))
    expect(result.snapshots.map(s => s.id)).toEqual(['def'])
    expect(result.activeIndex).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/utils/snapshotOps.test.ts`
Expected: FAIL — module `./snapshotOps` not found.

- [ ] **Step 3: Implement**

```typescript
import type { SnapshotState } from '../types/snapshot'

export interface SnapshotsModel {
  snapshots: SnapshotState[]
  activeIndex: number
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.max(0, Math.min(index, length - 1))
}

export function insertAfter(
  snapshots: SnapshotState[],
  index: number,
  item: SnapshotState,
): SnapshotsModel {
  const next = snapshots.slice()
  next.splice(index + 1, 0, item)
  return { snapshots: next, activeIndex: index + 1 }
}

export function removeAt(
  snapshots: SnapshotState[],
  index: number,
  makeDefault: () => SnapshotState,
): SnapshotsModel {
  const next = snapshots.filter((_, i) => i !== index)
  if (next.length === 0) return { snapshots: [makeDefault()], activeIndex: 0 }
  return { snapshots: next, activeIndex: clampIndex(index, next.length) }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/utils/snapshotOps.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/utils/snapshotOps.ts src/utils/snapshotOps.test.ts
git commit -m "feat(snapshots): pure array ops (clampIndex, insertAfter, removeAt)"
```

---

## Task 3: Versioned snapshot storage

**Files:**
- Create: `src/utils/snapshotStorage.ts`
- Test: `src/utils/snapshotStorage.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { loadSnapshots, saveSnapshots, SNAPSHOTS_STORAGE_KEY } from './snapshotStorage'
import type { SnapshotState } from '../types/snapshot'

const snap = (id: string): SnapshotState => ({
  id,
  activeCopedentId: 'c1',
  engagedControls: ['A'],
  selectedFret: 3,
  displayMode: 'letters',
  selectedKey: 'C',
  colorTheme: 'chordTones',
  showExtensions: true,
})

describe('snapshotStorage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing stored', () => {
    expect(loadSnapshots()).toBeNull()
  })

  it('round-trips saved data', () => {
    saveSnapshots({ snapshots: [snap('a'), snap('b')], activeIndex: 1 })
    expect(loadSnapshots()).toEqual({ snapshots: [snap('a'), snap('b')], activeIndex: 1 })
  })

  it('returns null on malformed JSON', () => {
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, '{not json')
    expect(loadSnapshots()).toBeNull()
  })

  it('returns null when snapshots is empty or missing', () => {
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify({ snapshots: [], activeIndex: 0 }))
    expect(loadSnapshots()).toBeNull()
  })

  it('repairs an out-of-range activeIndex to 0', () => {
    saveSnapshots({ snapshots: [snap('a')], activeIndex: 9 })
    expect(loadSnapshots()?.activeIndex).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/utils/snapshotStorage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import type { SnapshotState } from '../types/snapshot'

export const SNAPSHOTS_STORAGE_KEY = 'psv-snapshots-v1'

export interface SnapshotsPersisted {
  snapshots: SnapshotState[]
  activeIndex: number
}

export function loadSnapshots(): SnapshotsPersisted | null {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.snapshots) || parsed.snapshots.length === 0) {
      return null
    }
    const len = parsed.snapshots.length
    const activeIndex =
      typeof parsed.activeIndex === 'number' && parsed.activeIndex >= 0 && parsed.activeIndex < len
        ? parsed.activeIndex
        : 0
    return { snapshots: parsed.snapshots as SnapshotState[], activeIndex }
  } catch {
    return null
  }
}

export function saveSnapshots(data: SnapshotsPersisted): void {
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(data))
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/utils/snapshotStorage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/snapshotStorage.ts src/utils/snapshotStorage.test.ts
git commit -m "feat(snapshots): versioned localStorage load/save with self-heal"
```

---

## Task 4: Serialize/apply/default helpers

**Files:**
- Create: `src/utils/snapshotSync.ts`
- Test: `src/utils/snapshotSync.test.ts`

These are the bridge between live hook values and a `SnapshotState`. `serializeLive` is pure. `applySnapshot` calls a bag of setters in the correct order (copedent first — because switching copedent clears engaged controls — then controls, then the rest). `makeDefaultSnapshot` builds a blank slot.

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { serializeLive, applySnapshot, makeDefaultSnapshot } from './snapshotSync'
import type { SnapshotState } from '../types/snapshot'

describe('serializeLive', () => {
  it('builds a SnapshotState from live values', () => {
    const result = serializeLive('id1', {
      activeCopedentId: 'c1',
      engagedControls: new Set(['A', 'B']),
      selectedFret: 5,
      displayMode: 'letters',
      selectedKey: 'C',
      colorTheme: 'chordTones',
      showExtensions: false,
    })
    expect(result).toEqual({
      id: 'id1',
      activeCopedentId: 'c1',
      engagedControls: ['A', 'B'],
      selectedFret: 5,
      displayMode: 'letters',
      selectedKey: 'C',
      colorTheme: 'chordTones',
      showExtensions: false,
    })
  })
})

describe('applySnapshot', () => {
  it('applies copedent before controls, then all other setters', () => {
    const calls: string[] = []
    const setters = {
      setActiveCopedentId: vi.fn(() => calls.push('copedent')),
      setControls: vi.fn(() => calls.push('controls')),
      setSelectedFret: vi.fn(() => calls.push('fret')),
      setDisplayMode: vi.fn(() => calls.push('display')),
      setSelectedKey: vi.fn(() => calls.push('key')),
      setColorTheme: vi.fn(() => calls.push('theme')),
      setShowExtensions: vi.fn(() => calls.push('ext')),
    }
    const snap: SnapshotState = {
      id: 'id1',
      activeCopedentId: 'c2',
      engagedControls: ['A'],
      selectedFret: 3,
      displayMode: 'scaleDegrees',
      selectedKey: 'G',
      colorTheme: 'rootFocus',
      showExtensions: false,
    }
    applySnapshot(snap, setters)
    expect(calls[0]).toBe('copedent')
    expect(calls[1]).toBe('controls')
    expect(setters.setActiveCopedentId).toHaveBeenCalledWith('c2')
    expect(setters.setControls).toHaveBeenCalledWith(['A'])
    expect(setters.setSelectedFret).toHaveBeenCalledWith(3)
    expect(setters.setShowExtensions).toHaveBeenCalledWith(false)
  })
})

describe('makeDefaultSnapshot', () => {
  it('builds a blank slot for the given copedent id', () => {
    const result = makeDefaultSnapshot('id9', 'c1')
    expect(result).toEqual({
      id: 'id9',
      activeCopedentId: 'c1',
      engagedControls: [],
      selectedFret: null,
      displayMode: 'letters',
      selectedKey: 'C',
      colorTheme: 'chordTones',
      showExtensions: true,
    })
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/utils/snapshotSync.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import type { SnapshotState } from '../types/snapshot'
import type { NoteDisplayMode, ColorTheme } from '../types'

export interface LiveValues {
  activeCopedentId: string
  engagedControls: Set<string>
  selectedFret: number | null
  displayMode: NoteDisplayMode
  selectedKey: string
  colorTheme: ColorTheme
  showExtensions: boolean
}

export interface SnapshotSetters {
  setActiveCopedentId: (id: string) => void
  setControls: (controls: string[]) => void
  setSelectedFret: (fret: number | null) => void
  setDisplayMode: (mode: NoteDisplayMode) => void
  setSelectedKey: (key: string) => void
  setColorTheme: (theme: ColorTheme) => void
  setShowExtensions: (value: boolean) => void
}

export function serializeLive(id: string, live: LiveValues): SnapshotState {
  return {
    id,
    activeCopedentId: live.activeCopedentId,
    engagedControls: [...live.engagedControls],
    selectedFret: live.selectedFret,
    displayMode: live.displayMode,
    selectedKey: live.selectedKey,
    colorTheme: live.colorTheme,
    showExtensions: live.showExtensions,
  }
}

export function applySnapshot(snap: SnapshotState, setters: SnapshotSetters): void {
  // Copedent first: switching copedent clears engaged controls in useCopedentState,
  // so controls must be applied AFTER the copedent switch or they'd be wiped.
  setters.setActiveCopedentId(snap.activeCopedentId)
  setters.setControls(snap.engagedControls)
  setters.setSelectedFret(snap.selectedFret)
  setters.setDisplayMode(snap.displayMode)
  setters.setSelectedKey(snap.selectedKey)
  setters.setColorTheme(snap.colorTheme)
  setters.setShowExtensions(snap.showExtensions)
}

export function makeDefaultSnapshot(id: string, activeCopedentId: string): SnapshotState {
  return {
    id,
    activeCopedentId,
    engagedControls: [],
    selectedFret: null,
    displayMode: 'letters',
    selectedKey: 'C',
    colorTheme: 'chordTones',
    showExtensions: true,
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/utils/snapshotSync.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/snapshotSync.ts src/utils/snapshotSync.test.ts
git commit -m "feat(snapshots): serializeLive/applySnapshot/makeDefaultSnapshot helpers"
```

---

## Task 5: Add missing setters to existing hooks

`applySnapshot` needs `setShowExtensions(bool)` (today only `toggleShowExtensions` exists) and a non-toggling fret setter (today `selectFret` toggles to null when the value matches).

**Files:**
- Modify: `src/hooks/useCopedentState.ts`
- Test: `src/hooks/useCopedentState.test.ts`
- Modify: `src/hooks/useChordState.ts`
- Test: `src/hooks/useChordState.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/hooks/useCopedentState.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react'
import { useCopedentState } from './useCopedentState'

describe('setShowExtensions', () => {
  it('sets the value directly regardless of current state', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.setShowExtensions(false))
    expect(result.current.showExtensions).toBe(false)
    act(() => result.current.setShowExtensions(false))
    expect(result.current.showExtensions).toBe(false)
    act(() => result.current.setShowExtensions(true))
    expect(result.current.showExtensions).toBe(true)
  })
})
```

Append to `src/hooks/useChordState.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react'
import { useChordState } from './useChordState'

describe('setSelectedFret', () => {
  it('sets the fret without toggling on repeat', () => {
    const { result } = renderHook(() => useChordState())
    act(() => result.current.setSelectedFret(4))
    expect(result.current.selectedFret).toBe(4)
    act(() => result.current.setSelectedFret(4))
    expect(result.current.selectedFret).toBe(4) // does NOT toggle to null
    act(() => result.current.setSelectedFret(null))
    expect(result.current.selectedFret).toBeNull()
  })
})
```

(If a test file uses different import lines already, do not duplicate imports — add only the new `describe` block.)

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/hooks/useCopedentState.test.ts src/hooks/useChordState.test.ts`
Expected: FAIL — `setShowExtensions` / `setSelectedFret` are not functions.

- [ ] **Step 3: Implement**

In `src/hooks/useCopedentState.ts`, add a callback near `toggleShowExtensions`:

```typescript
  const setShowExtensionsValue = useCallback((value: boolean) => {
    setShowExtensions(value)
  }, [])
```

and add to the returned object:

```typescript
    setShowExtensions: setShowExtensionsValue,
```

In `src/hooks/useChordState.ts`, add a callback near `selectFret`:

```typescript
  const setSelectedFret = useCallback((fret: number | null) => {
    setSelectedFret_(fret)
  }, [])
```

To avoid a name clash, rename the `useState` setter on line 9 from `setSelectedFret` to `setSelectedFret_`:

```typescript
  const [selectedFret, setSelectedFret_] = useState<number | null>(null);
```

Update `selectFret` to use the renamed setter:

```typescript
  const selectFret = useCallback((fret: number | null) => {
    setSelectedFret_(prev => (prev === fret ? null : fret));
  }, []);
```

Add to the returned object:

```typescript
    setSelectedFret,
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/hooks/useCopedentState.test.ts src/hooks/useChordState.test.ts`
Expected: PASS. Also run `npx tsc --noEmit` — no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCopedentState.ts src/hooks/useCopedentState.test.ts src/hooks/useChordState.ts src/hooks/useChordState.test.ts
git commit -m "feat(snapshots): add direct setShowExtensions and setSelectedFret setters"
```

---

## Task 6: useSnapshots store hook

Holds `{ snapshots, activeIndex }`, seeds from storage (or one default), persists on change, and exposes `setAll` plus current values. Logic-heavy operations live in the pure ops (Task 2); this hook only wires state + persistence.

**Files:**
- Create: `src/hooks/useSnapshots.ts`
- Test: `src/hooks/useSnapshots.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSnapshots } from './useSnapshots'
import { loadSnapshots } from '../utils/snapshotStorage'
import { makeDefaultSnapshot } from '../utils/snapshotSync'
import type { SnapshotState } from '../types/snapshot'

const snap = (id: string): SnapshotState => makeDefaultSnapshot(id, 'c1')

describe('useSnapshots', () => {
  beforeEach(() => localStorage.clear())

  it('seeds one default snapshot when storage is empty', () => {
    const { result } = renderHook(() => useSnapshots(() => snap('seed')))
    expect(result.current.snapshots).toHaveLength(1)
    expect(result.current.activeIndex).toBe(0)
  })

  it('restores from storage when present', () => {
    localStorage.setItem(
      'psv-snapshots-v1',
      JSON.stringify({ snapshots: [snap('a'), snap('b')], activeIndex: 1 }),
    )
    const { result } = renderHook(() => useSnapshots(() => snap('seed')))
    expect(result.current.snapshots.map(s => s.id)).toEqual(['a', 'b'])
    expect(result.current.activeIndex).toBe(1)
  })

  it('persists on setAll', () => {
    const { result } = renderHook(() => useSnapshots(() => snap('seed')))
    act(() => result.current.setAll({ snapshots: [snap('x'), snap('y')], activeIndex: 1 }))
    expect(loadSnapshots()).toEqual({ snapshots: [snap('x'), snap('y')], activeIndex: 1 })
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/hooks/useSnapshots.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import { useState, useCallback, useEffect } from 'react'
import type { SnapshotState } from '../types/snapshot'
import type { SnapshotsModel } from '../utils/snapshotOps'
import { loadSnapshots, saveSnapshots } from '../utils/snapshotStorage'

export function useSnapshots(makeSeed: () => SnapshotState) {
  const [model, setModel] = useState<SnapshotsModel>(() => {
    const loaded = loadSnapshots()
    if (loaded) return loaded
    return { snapshots: [makeSeed()], activeIndex: 0 }
  })

  useEffect(() => {
    saveSnapshots(model)
  }, [model])

  const setAll = useCallback((next: SnapshotsModel) => {
    setModel(next)
  }, [])

  return {
    snapshots: model.snapshots,
    activeIndex: model.activeIndex,
    setAll,
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/hooks/useSnapshots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSnapshots.ts src/hooks/useSnapshots.test.ts
git commit -m "feat(snapshots): useSnapshots store hook with persistence"
```

---

## Task 7: SnapshotPager component

Presentational only — all callbacks come from props. Dots show count + active (click to jump), ‹ › step, `+` adds, × deletes the active snapshot.

**Files:**
- Create: `src/components/SnapshotPager/SnapshotPager.tsx`
- Test: `src/components/SnapshotPager/SnapshotPager.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnapshotPager } from './SnapshotPager'

const noop = () => {}

function setup(overrides = {}) {
  const props = {
    count: 3,
    activeIndex: 1,
    onGo: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onAdd: vi.fn(),
    onDeleteCurrent: vi.fn(),
    ...overrides,
  }
  render(<SnapshotPager {...props} />)
  return props
}

describe('SnapshotPager', () => {
  it('renders one dot per snapshot', () => {
    setup()
    expect(screen.getAllByRole('button', { name: /snapshot \d+/i })).toHaveLength(3)
  })

  it('calls onGo with the clicked dot index', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /snapshot 3/i }))
    expect(props.onGo).toHaveBeenCalledWith(2)
  })

  it('wires prev/next/add/delete buttons', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /previous snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /next snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /add snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete current snapshot/i }))
    expect(props.onPrev).toHaveBeenCalled()
    expect(props.onNext).toHaveBeenCalled()
    expect(props.onAdd).toHaveBeenCalled()
    expect(props.onDeleteCurrent).toHaveBeenCalled()
  })

  it('disables delete when only one snapshot exists', () => {
    setup({ count: 1, activeIndex: 0 })
    expect(screen.getByRole('button', { name: /delete current snapshot/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/components/SnapshotPager/SnapshotPager.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
interface SnapshotPagerProps {
  count: number
  activeIndex: number
  onGo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onAdd: () => void
  onDeleteCurrent: () => void
}

export function SnapshotPager({
  count,
  activeIndex,
  onGo,
  onPrev,
  onNext,
  onAdd,
  onDeleteCurrent,
}: SnapshotPagerProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onPrev}
      >
        ‹
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Snapshot ${i + 1}`}
            aria-current={i === activeIndex}
            className={`w-2.5 h-2.5 rounded-full ${
              i === activeIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            onClick={() => onGo(i)}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Next snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onNext}
      >
        ›
      </button>

      <button
        type="button"
        aria-label="Add snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
        onClick={onAdd}
      >
        +
      </button>

      <button
        type="button"
        aria-label="Delete current snapshot"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40"
        disabled={count <= 1}
        onClick={onDeleteCurrent}
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/components/SnapshotPager/SnapshotPager.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SnapshotPager/
git commit -m "feat(snapshots): SnapshotPager component (dots, arrows, add, delete)"
```

---

## Task 8: useHorizontalSwipe gesture hook

Detects a deliberate horizontal trackpad/touch swipe and fires `onSwipeLeft` / `onSwipeRight` once per gesture. Accumulates `wheel` `deltaX`, ignores pinch-zoom (`ctrlKey`), and resets after an idle gap so momentum scrolling fires only once.

**Files:**
- Create: `src/hooks/useHorizontalSwipe.ts`
- Test: `src/hooks/useHorizontalSwipe.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHorizontalSwipe } from './useHorizontalSwipe'

function makeTarget() {
  const listeners: Record<string, ((e: Event) => void)[]> = {}
  return {
    el: {
      addEventListener: (type: string, fn: (e: Event) => void) => {
        ;(listeners[type] ??= []).push(fn)
      },
      removeEventListener: (type: string, fn: (e: Event) => void) => {
        listeners[type] = (listeners[type] ?? []).filter(f => f !== fn)
      },
    } as unknown as HTMLElement,
    fire(type: string, e: Partial<WheelEvent>) {
      for (const fn of listeners[type] ?? []) fn({ preventDefault: () => {}, ...e } as Event)
    },
  }
}

describe('useHorizontalSwipe', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires onSwipeLeft once when deltaX exceeds threshold', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeLeft = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft, onSwipeRight: vi.fn(), threshold: 80 }))
    target.fire('wheel', { deltaX: 50, deltaY: 0, ctrlKey: false })
    target.fire('wheel', { deltaX: 50, deltaY: 0, ctrlKey: false })
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
  })

  it('ignores pinch-zoom (ctrlKey) and vertical-dominant scroll', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft, onSwipeRight, threshold: 80 }))
    target.fire('wheel', { deltaX: 100, deltaY: 0, ctrlKey: true })
    target.fire('wheel', { deltaX: 10, deltaY: 200, ctrlKey: false })
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('fires onSwipeRight for negative deltaX', () => {
    const target = makeTarget()
    const ref = { current: target.el }
    const onSwipeRight = vi.fn()
    renderHook(() => useHorizontalSwipe(ref, { onSwipeLeft: vi.fn(), onSwipeRight, threshold: 80 }))
    target.fire('wheel', { deltaX: -90, deltaY: 0, ctrlKey: false })
    expect(onSwipeRight).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm test -- src/hooks/useHorizontalSwipe.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface SwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
  idleResetMs?: number
}

export function useHorizontalSwipe(
  ref: RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight, threshold = 80, idleResetMs = 300 }: SwipeOptions,
) {
  const accum = useRef(0)
  const fired = useRef(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return // vertical-dominant

      e.preventDefault() // stop the browser back/forward gesture
      accum.current += e.deltaX

      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => {
        accum.current = 0
        fired.current = false
      }, idleResetMs)

      if (!fired.current && Math.abs(accum.current) >= threshold) {
        fired.current = true
        if (accum.current > 0) onSwipeLeft()
        else onSwipeRight()
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [ref, onSwipeLeft, onSwipeRight, threshold, idleResetMs])
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test -- src/hooks/useHorizontalSwipe.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHorizontalSwipe.ts src/hooks/useHorizontalSwipe.test.ts
git commit -m "feat(snapshots): useHorizontalSwipe gesture hook"
```

---

## Task 9: Wire snapshots into App

Compose the store + sync + ops into user-facing actions, render the pager, bind the swipe, and contain overscroll so the browser's own swipe-nav can't fire. There is no clean unit test for this wiring; verify by build + manual preview (Task 10).

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports** (top of `src/App.tsx`, with the other imports)

```typescript
import { useRef } from 'react'
import { useSnapshots } from './hooks/useSnapshots'
import { useHorizontalSwipe } from './hooks/useHorizontalSwipe'
import { SnapshotPager } from './components/SnapshotPager/SnapshotPager'
import { serializeLive, applySnapshot, makeDefaultSnapshot } from './utils/snapshotSync'
import { insertAfter, removeAt } from './utils/snapshotOps'
import type { SnapshotState } from './types/snapshot'
```

(Merge `useRef` into the existing `import { useState, useEffect, useMemo } from 'react'` line rather than adding a duplicate React import.)

- [ ] **Step 2: Set up the store, setter bag, and seed** (inside `App`, after `const [mutedNotes, ...]`)

```typescript
  // Snapshots: independent parallel configurations of the visualizer.
  const snapshotStore = useSnapshots(() =>
    makeDefaultSnapshot(crypto.randomUUID(), state.activeCopedentId),
  )

  const liveValues = {
    activeCopedentId: state.activeCopedentId,
    engagedControls: state.engagedControls,
    selectedFret: chordState.selectedFret,
    displayMode: state.displayMode,
    selectedKey: state.selectedKey,
    colorTheme: state.colorTheme,
    showExtensions: state.showExtensions,
  }

  const setters = {
    setActiveCopedentId: state.setActiveCopedentId,
    setControls: state.setControls,
    setSelectedFret: chordState.setSelectedFret,
    setDisplayMode: state.setDisplayMode,
    setSelectedKey: state.setSelectedKey,
    setColorTheme: state.setColorTheme,
    setShowExtensions: state.setShowExtensions,
  }

  const resetTransientPanels = () => {
    chordState.deactivateChordFinder()
    chordState.deactivateTransition()
    chordState.deactivateMoveTo()
  }
```

- [ ] **Step 3: Hydrate the active snapshot once on mount**

```typescript
  // On first mount, restore the persisted active snapshot into the live hooks.
  const didHydrate = useRef(false)
  useEffect(() => {
    if (didHydrate.current) return
    didHydrate.current = true
    applySnapshot(snapshotStore.snapshots[snapshotStore.activeIndex], setters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

- [ ] **Step 4: Add the switch/create/delete actions**

```typescript
  // Flush current live state into the active slot, returning the updated array.
  const flushCurrent = (): SnapshotState[] => {
    const current = serializeLive(
      snapshotStore.snapshots[snapshotStore.activeIndex].id,
      liveValues,
    )
    const next = snapshotStore.snapshots.slice()
    next[snapshotStore.activeIndex] = current
    return next
  }

  const goToSnapshot = (index: number) => {
    if (index < 0 || index >= snapshotStore.snapshots.length) return
    if (index === snapshotStore.activeIndex) return
    const flushed = flushCurrent()
    snapshotStore.setAll({ snapshots: flushed, activeIndex: index })
    resetTransientPanels()
    applySnapshot(flushed[index], setters)
  }

  const addClone = () => {
    const flushed = flushCurrent()
    const clone: SnapshotState = {
      ...flushed[snapshotStore.activeIndex],
      id: crypto.randomUUID(),
    }
    const model = insertAfter(flushed, snapshotStore.activeIndex, clone)
    snapshotStore.setAll(model)
    resetTransientPanels()
    applySnapshot(model.snapshots[model.activeIndex], setters)
  }

  const addBlank = () => {
    const flushed = flushCurrent()
    const blank = makeDefaultSnapshot(crypto.randomUUID(), state.activeCopedentId)
    const model = insertAfter(flushed, snapshotStore.activeIndex, blank)
    snapshotStore.setAll(model)
    resetTransientPanels()
    applySnapshot(model.snapshots[model.activeIndex], setters)
  }

  const nextSnapshot = () => {
    // Swiping past the last snapshot clones the current one (Safari-style).
    if (snapshotStore.activeIndex >= snapshotStore.snapshots.length - 1) {
      addClone()
    } else {
      goToSnapshot(snapshotStore.activeIndex + 1)
    }
  }

  const prevSnapshot = () => goToSnapshot(snapshotStore.activeIndex - 1)

  const deleteCurrent = () => {
    const model = removeAt(snapshotStore.snapshots, snapshotStore.activeIndex, () =>
      makeDefaultSnapshot(crypto.randomUUID(), state.activeCopedentId),
    )
    snapshotStore.setAll(model)
    resetTransientPanels()
    applySnapshot(model.snapshots[model.activeIndex], setters)
  }
```

NOTE: `addBlank` vs `addClone` — the `+` button offers a choice. Implement the choice with a minimal `window.confirm`-free inline toggle: for v1, the `+` button calls `addClone` and a small "blank" affordance calls `addBlank`. Wire both into the pager via the `onAdd` prop calling `addClone`; add a second control later if the popover is desired. (Spec calls for a clone/blank popover on `+`; deferred to a follow-up to keep this task focused — `addBlank` exists and is reachable.)

- [ ] **Step 5: Bind the swipe to a ref on `<main>`**

Add the ref near the other hooks:

```typescript
  const mainRef = useRef<HTMLElement>(null)
  useHorizontalSwipe(mainRef, { onSwipeLeft: nextSnapshot, onSwipeRight: prevSnapshot })
```

Change the `<main ...>` opening tag to attach the ref and contain horizontal overscroll (this is what stops the browser back/forward gesture):

```tsx
      <main ref={mainRef} className="p-6 space-y-6 max-w-3xl [overscroll-behavior-x:contain]">
```

- [ ] **Step 6: Render the pager** (inside `<main>`, as the first child, above the chord pickers)

```tsx
        <SnapshotPager
          count={snapshotStore.snapshots.length}
          activeIndex={snapshotStore.activeIndex}
          onGo={goToSnapshot}
          onPrev={prevSnapshot}
          onNext={nextSnapshot}
          onAdd={addClone}
          onDeleteCurrent={deleteCurrent}
        />
```

- [ ] **Step 7: Verify build + full test suite**

Run: `npm run build && npm test`
Expected: typecheck passes, production build succeeds, all tests green.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat(snapshots): wire snapshots, pager, and swipe into App"
```

---

## Task 10: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Use the preview tool (`preview_start` with name `dev`) — do NOT use `npm run dev` in a blocking shell.

- [ ] **Step 2: Verify the acceptance criteria by interaction**

Check each:
1. Pager shows one dot; ‹ › + × controls present; × disabled with a single snapshot.
2. Toggle pedal A, fret 3 → click `+` → new dot appears and is active (clone: still shows A/fret 3).
3. On the new snapshot toggle pedal B, move to fret 7. Click dot 1 → A/fret 3 restored. Click dot 2 → B/fret 7 restored. State is independent.
4. Two-finger swipe left/right over the visualizer steps between snapshots and does NOT trigger Safari/Chrome back-forward navigation.
5. Swipe left on the last snapshot creates a new (cloned) one.
6. Change copedent + color theme on one snapshot; confirm they're per-snapshot.
7. Reload the page → snapshots and active index are restored.
8. Delete a snapshot → it's removed and an adjacent one becomes active; deleting the last leaves one fresh default.

- [ ] **Step 3: Check the console for errors**

Use `preview_console_logs` (level `error`) — expect none.

- [ ] **Step 4: Final confirmation**

If all criteria pass, the feature is complete. Remind Gabe to push the branch.

---

## Notes / deferred (carried from spec)

- **Clone-vs-blank popover on `+`:** `addBlank` is implemented and reachable; the popover UI to choose clone vs blank on the `+` button is deferred to a follow-up (Task 9 wires `+` → clone).
- **overrideChord / mutedNotes:** intentionally NOT part of a snapshot — they are ephemeral and auto-reset when the detected chord changes (existing `useEffect` on `currentDetection`). Switching snapshots changes the detection, so they reset naturally.
- **Transient panels** (chord finder / transition / move-to) reset on every switch via `resetTransientPanels`.
- **Approaches B and C** remain documented in the spec for future revisiting.
```
