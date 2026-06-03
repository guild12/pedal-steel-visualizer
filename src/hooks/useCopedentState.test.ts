import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopedentState } from './useCopedentState'

beforeEach(() => {
  localStorage.clear()
})

describe('useCopedentState', () => {
  it('initializes with presets', () => {
    const { result } = renderHook(() => useCopedentState())
    expect(result.current.copedents).toHaveLength(3)
    expect(result.current.activeCopedent.name).toBe('Emmons E9')
  })

  it('toggles controls on and off', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.toggleControl('A'))
    expect(result.current.engagedControls.has('A')).toBe(true)
    act(() => result.current.toggleControl('A'))
    expect(result.current.engagedControls.has('A')).toBe(false)
  })

  it('clears all controls', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => {
      result.current.toggleControl('A')
      result.current.toggleControl('B')
    })
    act(() => result.current.clearAllControls())
    expect(result.current.engagedControls.size).toBe(0)
  })

  it('switches active copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const c6Id = result.current.copedents[1].id
    act(() => result.current.setActiveCopedentId(c6Id))
    expect(result.current.activeCopedent.name).toBe('Emmons C6')
  })

  it('clears engaged controls when switching copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.toggleControl('A'))
    const c6Id = result.current.copedents[1].id
    act(() => result.current.setActiveCopedentId(c6Id))
    expect(result.current.engagedControls.size).toBe(0)
  })

  it('changes display mode', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.setDisplayMode('scaleDegrees'))
    expect(result.current.displayMode).toBe('scaleDegrees')
  })

  it('duplicates a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.duplicateCopedent(result.current.copedents[0].id))
    expect(result.current.copedents).toHaveLength(4)
    expect(result.current.copedents[3].name).toContain('Copy')
  })

  it('deletes a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const e9Id = result.current.copedents[0].id
    act(() => result.current.deleteCopedent(e9Id))
    expect(result.current.copedents).toHaveLength(2)
  })

  it('does not delete last copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.deleteCopedent(result.current.copedents[0].id))
    act(() => result.current.deleteCopedent(result.current.copedents[0].id))
    expect(result.current.copedents).toHaveLength(1)
  })

  it('updates a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const id = result.current.copedents[0].id
    act(() => result.current.updateCopedent(id, { name: 'My E9' }))
    expect(result.current.copedents[0].name).toBe('My E9')
  })

  it('sets engaged controls wholesale via setControls', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.setControls(['A', 'B']))
    expect(result.current.engagedControls).toEqual(new Set(['A', 'B']))
    act(() => result.current.setControls([]))
    expect(result.current.engagedControls).toEqual(new Set())
  })

  it('defaults showExtensions to true, toggles it, and persists', () => {
    const { result } = renderHook(() => useCopedentState())
    expect(result.current.showExtensions).toBe(true)
    act(() => result.current.toggleShowExtensions())
    expect(result.current.showExtensions).toBe(false)
    expect(localStorage.getItem('psv-showExtensions')).toBe('false')
  })

  it('restores showExtensions=false from localStorage', () => {
    localStorage.setItem('psv-showExtensions', 'false')
    const { result } = renderHook(() => useCopedentState())
    expect(result.current.showExtensions).toBe(false)
  })

  it('creates a new copedent and switches to it', () => {
    const { result } = renderHook(() => useCopedentState())
    const newCop = {
      id: 'new-1', name: 'Custom', pedals: ['X'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    act(() => result.current.createCopedent(newCop))
    expect(result.current.copedents).toHaveLength(4)
    expect(result.current.activeCopedent.name).toBe('Custom')
  })
})

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
