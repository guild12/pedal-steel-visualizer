import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HintStrip, HINTS_DISMISSED_KEY } from './HintStrip'

describe('HintStrip', () => {
  beforeEach(() => localStorage.clear())

  it('shows on first run with the pedal key range', () => {
    render(<HintStrip pedalCount={3} />)
    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(screen.getByText(/Press 1–3/)).toBeInTheDocument()
  })

  it('caps the key range at 9 pedals', () => {
    render(<HintStrip pedalCount={12} />)
    expect(screen.getByText(/Press 1–9/)).toBeInTheDocument()
  })

  it('dismisses and remembers it', async () => {
    render(<HintStrip pedalCount={3} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByRole('note')).toBeNull()
    expect(localStorage.getItem(HINTS_DISMISSED_KEY)).toBe('true')
  })

  it('stays hidden once dismissed', () => {
    localStorage.setItem(HINTS_DISMISSED_KEY, 'true')
    render(<HintStrip pedalCount={3} />)
    expect(screen.queryByRole('note')).toBeNull()
  })
})
