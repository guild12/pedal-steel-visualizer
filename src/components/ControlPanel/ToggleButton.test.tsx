import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleButton } from './ToggleButton'

describe('ToggleButton', () => {
  it('tints the border with the control color when idle', () => {
    render(<ToggleButton label="A" engaged={false} color="#E63946" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.getAttribute('data-engaged')).toBe('false')
    expect(btn.style.borderColor).toBeTruthy()
  })

  it('fills with the control color when engaged', () => {
    render(<ToggleButton label="A" engaged={true} color="#E63946" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.getAttribute('data-engaged')).toBe('true')
    expect(btn.style.backgroundColor).toBeTruthy()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ToggleButton label="A" engaged={false} color="#E63946" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
