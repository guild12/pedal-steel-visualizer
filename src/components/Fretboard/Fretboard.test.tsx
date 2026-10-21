import { describe, it, expect, vi, afterEach } from 'vitest'
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

  it('renders a solid tone-bar shape at the selected fret', () => {
    const { container } = render(<Fretboard {...defaultProps} selectedFret={5} />)
    const bar = container.querySelector('path[d^="M"]')
    expect(bar).toBeTruthy()
    // It's a solid outline now, not the old dashed strip.
    expect(bar?.getAttribute('stroke-dasharray')).toBeNull()
    expect(container.querySelector('[stroke-dasharray="4,3"]')).toBeNull()
  })

  it('shows no tone bar when no fret is selected', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    expect(container.querySelector('path[d^="M"]')).toBeNull()
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

  it('wrapper scrolls horizontally instead of shrinking the board', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('overflow-x-auto')
    expect(wrapper.className).toContain('w-full')
  })

  it('gives the SVG a pixel width equal to the viewBox width', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const svg = container.querySelector('svg')!
    const viewBoxWidth = svg.getAttribute('viewBox')!.split(' ')[2]
    expect(svg.getAttribute('width')).not.toBe('100%')
    expect(svg.getAttribute('width')).toBe(viewBoxWidth)
  })

  it('grows taller with more strings', () => {
    const strings14 = Array.from({ length: 14 }, (_, i) => ({
      ...E9_PRESET.strings[i % E9_PRESET.strings.length],
      number: i + 1,
    }))
    const small = render(<Fretboard {...defaultProps} />)
    const h10 = Number(small.container.querySelector('svg')!.getAttribute('height'))
    small.unmount()
    const big = render(<Fretboard {...defaultProps} copedent={{ ...E9_PRESET, strings: strings14 }} />)
    const h14 = Number(big.container.querySelector('svg')!.getAttribute('height'))
    expect(h14).toBeGreaterThan(h10)
  })

  describe('narrow container', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('keeps a readable minimum width (scrolls) instead of shrinking', () => {
      class NarrowResizeObserver {
        cb: ResizeObserverCallback
        constructor(cb: ResizeObserverCallback) { this.cb = cb }
        observe() {
          this.cb([{ contentRect: { width: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver)
        }
        unobserve() {}
        disconnect() {}
      }
      vi.stubGlobal('ResizeObserver', NarrowResizeObserver)
      const { container } = render(<Fretboard {...defaultProps} />)
      const svg = container.querySelector('svg')!
      const width = Number(svg.getAttribute('width'))
      expect(width).toBeGreaterThanOrEqual(13 * 40 + 50 + 10)
      expect(svg.getAttribute('viewBox')!.split(' ')[2]).toBe(String(width))
    })
  })
})
