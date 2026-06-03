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
