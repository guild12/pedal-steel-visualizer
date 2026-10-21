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

  const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'Copedent actions' }))

  it('renders Edit visible and other actions inside the menu', async () => {
    render(<CopedentManager {...defaultProps} />)
    expect(screen.getByRole('button', { name: /edit/i })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: /new/i })).toBeNull()
    await openMenu()
    expect(screen.getByRole('menuitem', { name: /new/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /save/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /load/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeTruthy()
  })

  it('menu is closed by default and toggles aria-expanded', async () => {
    render(<CopedentManager {...defaultProps} />)
    const trigger = screen.getByRole('button', { name: 'Copedent actions' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes the menu after choosing an item', async () => {
    const onNew = vi.fn()
    render(<CopedentManager {...defaultProps} onCreateNew={onNew} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /new/i }))
    expect(onNew).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes the menu on Escape', async () => {
    render(<CopedentManager {...defaultProps} />)
    await openMenu()
    expect(screen.getByRole('menu')).toBeTruthy()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes the menu on click outside', async () => {
    render(<CopedentManager {...defaultProps} />)
    await openMenu()
    await userEvent.click(document.body)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('calls onDuplicate with active copedent id', async () => {
    const onDup = vi.fn()
    render(<CopedentManager {...defaultProps} onDuplicate={onDup} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /duplicate/i }))
    expect(onDup).toHaveBeenCalledWith(E9_PRESET.id)
  })

  it('calls onDelete with active copedent id after confirmation', async () => {
    const onDel = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CopedentManager {...defaultProps} onDelete={onDel} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(onDel).toHaveBeenCalledWith(E9_PRESET.id)
    confirmSpy.mockRestore()
  })

  it('does not delete when confirmation is cancelled', async () => {
    const onDel = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<CopedentManager {...defaultProps} onDelete={onDel} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(onDel).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
