import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Fretboard } from './Fretboard'
import { E9_PRESET } from '../../data/presets'

const defaultProps = {
  copedent: E9_PRESET,
  engagedControls: new Set<string>(),
  displayMode: 'letters' as const,
  selectedKey: 'C',
}

describe('Fretboard', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders string number labels', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const textEls = container.querySelectorAll('svg text')
    const texts = Array.from(textEls).map(el => el.textContent)
    expect(texts).toContain('1')
    expect(texts).toContain('10')
  })

  it('renders fret number labels', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const textEls = container.querySelectorAll('svg text')
    const texts = Array.from(textEls).map(el => el.textContent)
    expect(texts).toContain('12')
  })

  it('renders note indicators as circles', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const noteGroup = container.querySelector('.note-indicators')
    const circles = noteGroup?.querySelectorAll('circle') ?? []
    // 10 strings x 13 frets (0-12) = 130 circles
    expect(circles.length).toBe(130)
  })

  it('highlights changed notes when controls are engaged', () => {
    const { container } = render(
      <Fretboard {...defaultProps} engagedControls={new Set(['A'])} />
    )
    const highlighted = container.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted.length).toBeGreaterThan(0)
  })

  it('shows no highlights when no controls are engaged', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const highlighted = container.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted.length).toBe(0)
  })

  it('shows scale degrees when displayMode is scaleDegrees', () => {
    const { container } = render(
      <Fretboard {...defaultProps} displayMode="scaleDegrees" selectedKey="E" />
    )
    const noteGroup = container.querySelector('.note-indicators')
    const texts = Array.from(noteGroup?.querySelectorAll('text') ?? []).map(el => el.textContent)
    expect(texts.filter(t => t === '1').length).toBeGreaterThan(0)
    expect(texts.filter(t => t === '5').length).toBeGreaterThan(0)
  })
})
