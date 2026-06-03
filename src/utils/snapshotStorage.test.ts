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
