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
  it('returns saved copedents when storage has data', () => {
    const custom: Copedent = {
      id: 'custom-1', name: 'My Custom', pedals: ['A'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([custom]))
    const result = loadCopedents()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('My Custom')
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
