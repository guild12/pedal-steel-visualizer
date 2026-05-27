import { describe, it, expect } from 'vitest'
import { getControlColor } from './controlColors'

describe('getControlColor', () => {
  it('returns the fixed color for known control names', () => {
    expect(getControlColor('A')).toBe('#E63946')
    expect(getControlColor('LKL')).toBe('#8338EC')
  })

  it('maps letter and number pedals that share a slot to the same color', () => {
    expect(getControlColor('A')).toBe(getControlColor('1'))
    expect(getControlColor('B')).toBe(getControlColor('2'))
    expect(getControlColor('C')).toBe(getControlColor('3'))
  })

  it('returns a stable hex fallback for unknown names', () => {
    const first = getControlColor('ZZZ')
    expect(first).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(getControlColor('ZZZ')).toBe(first)
  })
})
