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
