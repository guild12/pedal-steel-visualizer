import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NoteIndicators } from './NoteIndicators'
import { E9_PRESET } from '../../data/presets'

const baseProps = {
  strings: E9_PRESET.strings,
  engagedControls: new Set(['A']),
  displayMode: 'letters' as const,
  selectedKey: 'C',
  fretboardWidth: 500,
  fretboardHeight: 300,
  leftMargin: 50,
  chordNotes: null,
  colorTheme: 'chordTones' as const,
}

describe('NoteIndicators', () => {
  it('does not paint pedal-altered non-chord notes red', () => {
    const { container } = render(<svg><NoteIndicators {...baseProps} /></svg>)
    const circles = Array.from(container.querySelectorAll('circle'))
    const red = circles.filter(c => (c.getAttribute('fill') ?? '').toLowerCase() === '#e63946')
    expect(red.length).toBe(0)
  })

  it('still flags altered notes via data-highlighted', () => {
    const { container } = render(<svg><NoteIndicators {...baseProps} /></svg>)
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBeGreaterThan(0)
  })

  const maxRadius = (props: Partial<typeof baseProps>) => {
    const { container } = render(<svg><NoteIndicators {...baseProps} {...props} /></svg>)
    const radii = Array.from(container.querySelectorAll('circle')).map(c => Number(c.getAttribute('r')))
    return Math.max(...radii)
  }

  it('grows note circles with fretboard width but never beyond 15', () => {
    const narrow = maxRadius({ fretboardWidth: 400 })
    const wide = maxRadius({ fretboardWidth: 1100 })
    expect(wide).toBeGreaterThan(narrow)
    expect(wide).toBeLessThanOrEqual(15)
    expect(narrow).toBeGreaterThanOrEqual(9)
  })

  it('keeps about 11px radius at today\'s widths', () => {
    expect(maxRadius({ fretboardWidth: 650 })).toBeCloseTo(10.8, 1)
  })

  it('never lets circles overlap vertically on a short board', () => {
    const r = maxRadius({ fretboardWidth: 1100, fretboardHeight: 150 })
    const spacing = (150 - 40) / (E9_PRESET.strings.length - 1)
    expect(r * 2).toBeLessThanOrEqual(spacing - 6 + 1e-9)
  })

  it('scales font size with radius', () => {
    const { container } = render(<svg><NoteIndicators {...baseProps} fretboardWidth={1100} /></svg>)
    const r = Number(container.querySelector('circle')!.getAttribute('r'))
    const fs = Number(container.querySelector('text')!.getAttribute('font-size'))
    expect(fs).toBe(Math.round(r * 0.82))
  })
})
