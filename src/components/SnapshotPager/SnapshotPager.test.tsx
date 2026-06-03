import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnapshotPager } from './SnapshotPager'

function setup(overrides = {}) {
  const props = {
    count: 3,
    activeIndex: 1,
    onGo: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onAdd: vi.fn(),
    onDeleteCurrent: vi.fn(),
    ...overrides,
  }
  render(<SnapshotPager {...props} />)
  return props
}

describe('SnapshotPager', () => {
  it('renders one dot per snapshot', () => {
    setup()
    expect(screen.getAllByRole('button', { name: /snapshot \d+/i })).toHaveLength(3)
  })

  it('calls onGo with the clicked dot index', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /snapshot 3/i }))
    expect(props.onGo).toHaveBeenCalledWith(2)
  })

  it('wires prev/next/add/delete buttons', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: /previous snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /next snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /add snapshot/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete current snapshot/i }))
    expect(props.onPrev).toHaveBeenCalled()
    expect(props.onNext).toHaveBeenCalled()
    expect(props.onAdd).toHaveBeenCalled()
    expect(props.onDeleteCurrent).toHaveBeenCalled()
  })

  it('disables delete when only one snapshot exists', () => {
    setup({ count: 1, activeIndex: 0 })
    expect(screen.getByRole('button', { name: /delete current snapshot/i })).toBeDisabled()
  })
})
