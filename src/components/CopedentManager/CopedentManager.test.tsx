import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopedentManager } from './CopedentManager'
import { E9_PRESET, C6_PRESET } from '../../data/presets'

const defaultProps = {
  copedents: [E9_PRESET, C6_PRESET],
  activeCopedentId: E9_PRESET.id,
  onSelect: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onCreateNew: vi.fn(),
  onOpenEditor: vi.fn(),
  onSaveToFile: vi.fn(),
  onLoadFromFile: vi.fn(),
}

describe('CopedentManager', () => {
  it('renders copedent selector with all copedents', () => {
    render(<CopedentManager {...defaultProps} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeTruthy()
  })

  it('renders action buttons', () => {
    render(<CopedentManager {...defaultProps} />)
    expect(screen.getByRole('button', { name: /new/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /edit/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /save/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /load/i })).toBeTruthy()
  })

  it('calls onDuplicate with active copedent id', async () => {
    const onDup = vi.fn()
    render(<CopedentManager {...defaultProps} onDuplicate={onDup} />)
    await userEvent.click(screen.getByRole('button', { name: /duplicate/i }))
    expect(onDup).toHaveBeenCalledWith(E9_PRESET.id)
  })

  it('calls onDelete with active copedent id after confirmation', async () => {
    const onDel = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CopedentManager {...defaultProps} onDelete={onDel} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDel).toHaveBeenCalledWith(E9_PRESET.id)
    confirmSpy.mockRestore()
  })

  it('does not delete when confirmation is cancelled', async () => {
    const onDel = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<CopedentManager {...defaultProps} onDelete={onDel} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDel).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
