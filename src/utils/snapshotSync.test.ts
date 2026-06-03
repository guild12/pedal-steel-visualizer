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
