import { describe, it, expect } from 'vitest'
import { validateCopedent } from './validation'
import type { Copedent } from '../types'

function makeCopedent(overrides: Partial<Copedent> = {}): Copedent {
  return {
    id: 'test-id',
    name: 'Test',
    pedals: ['A', 'B'],
    kneeLevers: ['LKL'],
    strings: [
      { number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 1 }] },
    ],
    ...overrides,
  }
}

describe('validateCopedent', () => {
  it('returns no errors for valid copedent', () => {
    expect(validateCopedent(makeCopedent())).toEqual([])
  })
  it('rejects zero semitones', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 0 }] }],
    })
    const errors = validateCopedent(cop)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('strings[0].changes[0].semitones')
  })
  it('rejects duplicate control on same string', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'E4', changes: [
        { control: 'A', semitones: 1 },
        { control: 'A', semitones: -1 },
      ]}],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('duplicate'))).toBe(true)
  })
  it('rejects string count > 14', () => {
    const strings = Array.from({ length: 15 }, (_, i) => ({ number: i + 1, openNote: 'E4', changes: [] }))
    const errors = validateCopedent(makeCopedent({ strings }))
    expect(errors.some(e => e.field === 'strings')).toBe(true)
  })
  it('rejects string count < 1', () => {
    const errors = validateCopedent(makeCopedent({ strings: [] }))
    expect(errors.some(e => e.field === 'strings')).toBe(true)
  })
  it('rejects more than 12 pedals', () => {
    const pedals = Array.from({ length: 13 }, (_, i) => `P${i}`)
    const errors = validateCopedent(makeCopedent({ pedals }))
    expect(errors.some(e => e.field === 'pedals')).toBe(true)
  })
  it('rejects more than 12 knee levers', () => {
    const kneeLevers = Array.from({ length: 13 }, (_, i) => `K${i}`)
    const errors = validateCopedent(makeCopedent({ kneeLevers }))
    expect(errors.some(e => e.field === 'kneeLevers')).toBe(true)
  })
  it('rejects open note outside C1-C7 range', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'C0', changes: [] }],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('range'))).toBe(true)
  })
  it('rejects empty name', () => {
    const errors = validateCopedent(makeCopedent({ name: '' }))
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })
  it('rejects change referencing non-existent control', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'E4', changes: [{ control: 'Z', semitones: 1 }] }],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('unknown control'))).toBe(true)
  })
})
