import { describe, it, expect } from 'vitest'
import { getFretX, getStringY, getStringThickness, FRET_MARKER_FRETS } from './fretUtils'

describe('getFretX', () => {
  it('returns 0 for fret 0 (nut)', () => {
    expect(getFretX(0, 1000)).toBe(0)
  })
  it('returns positions that decrease in spacing as fret number increases', () => {
    const spacing1 = getFretX(2, 1000) - getFretX(1, 1000)
    const spacing2 = getFretX(3, 1000) - getFretX(2, 1000)
    expect(spacing2).toBeLessThan(spacing1)
  })
  it('returns scaled positions relative to total width', () => {
    const pos500 = getFretX(5, 500)
    const pos1000 = getFretX(5, 1000)
    expect(pos1000).toBeCloseTo(pos500 * 2, 0)
  })
})

describe('getStringY', () => {
  it('returns evenly spaced positions', () => {
    const y1 = getStringY(0, 10, 200)
    const y2 = getStringY(1, 10, 200)
    const y3 = getStringY(2, 10, 200)
    expect(y2 - y1).toBeCloseTo(y3 - y2)
  })
  it('centers a single string', () => {
    const y = getStringY(0, 1, 200)
    expect(y).toBe(100)
  })
})

describe('getStringThickness', () => {
  it('thinner for higher strings (lower index)', () => {
    expect(getStringThickness(0, 10)).toBeLessThan(getStringThickness(9, 10))
  })
})

describe('FRET_MARKER_FRETS', () => {
  it('includes standard marker frets', () => {
    expect(FRET_MARKER_FRETS).toEqual(
      expect.arrayContaining([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
    )
  })
})
