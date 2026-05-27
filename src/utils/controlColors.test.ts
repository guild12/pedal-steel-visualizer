import { describe, it, expect } from 'vitest'
import { getControlColor, readableTextColor } from './controlColors'

describe('getControlColor', () => {
  it('returns the fixed color for known control names', () => {
    expect(getControlColor('A')).toBe('#E63946')
    expect(getControlColor('LKL')).toBe('#4361EE')
  })

  it('never gives a pedal the same color as a knee lever', () => {
    const pedalColors = ['A', 'B', 'C', '4', '5', '6', '7', '8'].map(getControlColor)
    const leverColors = ['LKL', 'LKR', 'LKV', 'VLOCK', 'RKL', 'RKR', 'RKR2'].map(getControlColor)
    for (const pc of pedalColors) {
      expect(leverColors).not.toContain(pc)
    }
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

describe('readableTextColor', () => {
  it('uses dark text on light backgrounds', () => {
    expect(readableTextColor('#FFD166')).toBe('#1a1a1a') // light yellow
    expect(readableTextColor('#FFBE0B')).toBe('#1a1a1a') // amber
  })

  it('uses white text on dark/saturated backgrounds', () => {
    expect(readableTextColor('#E63946')).toBe('#fff') // red
    expect(readableTextColor('#4895EF')).toBe('#fff') // blue
  })
})
