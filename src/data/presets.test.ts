import { describe, it, expect } from 'vitest'
import { E9_PRESET, C6_PRESET } from './presets'
import { validateCopedent } from '../utils/validation'

describe('E9 preset', () => {
  it('has 10 strings', () => { expect(E9_PRESET.strings).toHaveLength(10) })
  it('has standard E9 pedals (A, B, C)', () => { expect(E9_PRESET.pedals).toEqual(expect.arrayContaining(['A', 'B', 'C'])) })
  it('has knee levers', () => { expect(E9_PRESET.kneeLevers.length).toBeGreaterThan(0) })
  it('passes validation', () => { expect(validateCopedent(E9_PRESET)).toEqual([]) })
  it('has correct open string 1 (F#4)', () => { expect(E9_PRESET.strings[0].openNote).toBe('F#4') })
})

describe('C6 preset', () => {
  it('has 10 strings', () => { expect(C6_PRESET.strings).toHaveLength(10) })
  it('passes validation', () => { expect(validateCopedent(C6_PRESET)).toEqual([]) })
  it('has correct open string 1 (C4)', () => { expect(C6_PRESET.strings[0].openNote).toBe('C4') })
})
