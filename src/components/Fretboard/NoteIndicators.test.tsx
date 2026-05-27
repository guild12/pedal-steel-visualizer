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
})
