import { describe, it, expect } from 'vitest'
import { parseCopedentJson } from './copedentImport'
import { E9_PRESET } from '../data/presets'

describe('parseCopedentJson', () => {
  it('accepts a valid preset and assigns the requested id', () => {
    const result = parseCopedentJson(JSON.stringify(E9_PRESET), 'new-id')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.copedent.id).toBe('new-id')
      expect(result.copedent.name).toBe('Emmons E9')
    }
  })

  it('keeps the original id when none is requested', () => {
    const result = parseCopedentJson(JSON.stringify(E9_PRESET))
    expect(result.ok && result.copedent.id).toBe('preset-e9')
  })

  it('rejects malformed JSON', () => {
    const result = parseCopedentJson('{not json')
    expect(result).toEqual({ ok: false, error: 'Invalid JSON' })
  })

  it('rejects objects that are not copedent-shaped', () => {
    const result = parseCopedentJson(JSON.stringify({ snapshots: [], activeIndex: 0 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Not a copedent file/)
  })

  it('rejects a copedent that fails validation and names the problem', () => {
    const bad = { ...E9_PRESET, strings: E9_PRESET.strings.map((s, i) => i === 0 ? { ...s, openNote: 'H9' } : s) }
    const result = parseCopedentJson(JSON.stringify(bad))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Invalid note: H9/)
  })

  it('drops unknown top-level keys', () => {
    const result = parseCopedentJson(JSON.stringify({ ...E9_PRESET, extra: 1 }))
    expect(result.ok && 'extra' in result.copedent).toBe(false)
  })
})
