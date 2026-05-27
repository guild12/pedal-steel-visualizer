import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlPanel } from './ControlPanel'

const defaultProps = {
  pedals: ['A', 'B', 'C'],
  kneeLevers: ['LKL', 'LKR', 'RKL'],
  engagedControls: new Set<string>(),
  onToggleControl: vi.fn(),
  onClearAll: vi.fn(),
  displayMode: 'letters' as const,
  selectedKey: 'C',
  onDisplayModeChange: vi.fn(),
  onSelectedKeyChange: vi.fn(),
  showExtensions: true,
  onToggleShowExtensions: vi.fn(),
}

describe('ControlPanel', () => {
  it('renders all pedal buttons', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'A' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'B' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'C' })).toBeTruthy()
  })

  it('renders all knee lever buttons', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'LKL' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'LKR' })).toBeTruthy()
  })

  it('calls onToggleControl when a pedal is clicked', async () => {
    const onToggle = vi.fn()
    render(<ControlPanel {...defaultProps} onToggleControl={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onToggle).toHaveBeenCalledWith('A')
  })

  it('shows engaged controls as visually distinct', () => {
    render(
      <ControlPanel {...defaultProps} engagedControls={new Set(['A'])} />
    )
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.dataset.engaged).toBe('true')
  })

  it('renders clear all button', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeTruthy()
  })

  it('calls onClearAll when clear all is clicked', async () => {
    const onClear = vi.fn()
    render(<ControlPanel {...defaultProps} onClearAll={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(onClear).toHaveBeenCalled()
  })
})
