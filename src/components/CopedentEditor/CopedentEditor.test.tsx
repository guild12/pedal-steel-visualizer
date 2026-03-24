import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopedentEditor } from './CopedentEditor'
import { E9_PRESET } from '../../data/presets'

const defaultProps = {
  copedent: E9_PRESET,
  onUpdate: vi.fn(),
  onClose: vi.fn(),
}

describe('CopedentEditor', () => {
  it('renders copedent name input', () => {
    render(<CopedentEditor {...defaultProps} />)
    const input = screen.getByDisplayValue('Emmons E9')
    expect(input).toBeTruthy()
  })

  it('renders string open note inputs', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByDisplayValue('F#4')).toBeTruthy()
  })

  it('renders changes matrix', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
  })

  it('calls onUpdate when name changes', async () => {
    const onUpdate = vi.fn()
    render(<CopedentEditor {...defaultProps} onUpdate={onUpdate} />)
    const input = screen.getByDisplayValue('Emmons E9')
    await userEvent.clear(input)
    await userEvent.type(input, 'My E9')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('renders close button', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy()
  })

  it('renders import/export section', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByRole('button', { name: /export/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /import/i })).toBeTruthy()
  })
})
