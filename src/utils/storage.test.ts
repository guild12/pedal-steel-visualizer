import { describe, it, expect, beforeEach } from 'vitest'
import { loadCopedents, saveCopedents, STORAGE_KEY } from './storage'
import { E9_PRESET } from '../data/presets'
import type { Copedent } from '../types'

beforeEach(() => {
  localStorage.clear()
})

describe('loadCopedents', () => {
  it('returns presets when storage is empty', () => {
    const result = loadCopedents()
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Emmons E9')
    expect(result[1].name).toBe('Emmons C6')
    expect(result[2].name).toBe('E9/B6 Universal')
  })
  it('returns saved copedents and re-adds any missing built-in presets', () => {
    const custom: Copedent = {
      id: 'custom-1', name: 'My Custom', pedals: ['A'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([custom]))
    const result = loadCopedents()
    const names = result.map(c => c.name)
    expect(names).toContain('My Custom')
    expect(names).toContain('Emmons E9')
    expect(names).toContain('Emmons C6')
    expect(result).toHaveLength(4) // 3 built-ins restored + custom
  })

  it('restores a deleted built-in preset on the next load', () => {
    // User accidentally deleted E9, leaving only C6 saved.
    const c6Only: Copedent = {
      id: 'preset-c6', name: 'Emmons C6', pedals: [], kneeLevers: [],
      strings: [{ number: 1, openNote: 'C4', changes: [] }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([c6Only]))
    const names = loadCopedents().map(c => c.name)
    expect(names).toContain('Emmons E9') // restored
    expect(names).toContain('Emmons C6') // preserved
  })

  it('does not duplicate built-ins that are already present', () => {
    const custom: Copedent = {
      id: 'custom-1', name: 'My Custom', pedals: ['A'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    // Save all 3 presets + a custom one.
    const all = [...loadCopedents(), custom]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    const result = loadCopedents()
    expect(result).toHaveLength(4) // no duplicate presets
  })
  it('returns presets when storage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const result = loadCopedents()
    expect(result).toHaveLength(3)
  })
})

describe('saveCopedents', () => {
  it('persists copedents to localStorage', () => {
    saveCopedents([E9_PRESET])
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Emmons E9')
  })
})
