import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StringLines } from './StringLines'
import { getControlColor } from '../../utils/controlColors'
import type { StringConfig } from '../../types'

const strings: StringConfig[] = [
  { number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 2 }] },
  { number: 2, openNote: 'B3', changes: [{ control: 'A', semitones: 2 }, { control: 'C', semitones: 1 }] },
  { number: 3, openNote: 'G#3', changes: [{ control: 'B', semitones: 1 }] },
]

function renderLines(engaged: string[]) {
  return render(
    <svg>
      <StringLines
        strings={strings}
        engagedControls={new Set(engaged)}
        fretboardHeight={300}
        totalWidth={500}
      />
    </svg>
  )
}

describe('StringLines', () => {
  it('renders gray lines when no controls are engaged', () => {
    const { container } = renderLines([])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    expect(lines.length).toBe(3)
    lines.forEach(l => expect(l.getAttribute('stroke')).toBe('#9ca3af'))
  })

  it('colors strings moved by one engaged control with that control color', () => {
    const { container } = renderLines(['A'])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    const colored = lines.filter(l => l.getAttribute('stroke') === getControlColor('A'))
    expect(colored.length).toBe(2) // strings 1 and 2
  })

  it('draws two dashed lines for a string moved by two engaged controls', () => {
    const { container } = renderLines(['A', 'C'])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    const dashed = lines.filter(l => l.getAttribute('stroke-dasharray'))
    expect(dashed.length).toBe(2) // string 2: A + C
    const strokes = dashed.map(l => l.getAttribute('stroke'))
    expect(strokes).toContain(getControlColor('A'))
    expect(strokes).toContain(getControlColor('C'))
  })
})
