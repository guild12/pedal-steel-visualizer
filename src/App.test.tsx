import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { SNAPSHOTS_STORAGE_KEY, type SnapshotsPersisted } from './utils/snapshotStorage'

beforeEach(() => {
  localStorage.clear()
})

// The A/B pedal buttons are <ToggleButton> with data-engaged="true"|"false".
// We match by exact accessible name so "A"/"B" don't collide with knee levers.
function pedal(label: string): HTMLElement {
  return screen.getByRole('button', { name: label })
}

describe('App snapshots integration', () => {
  it('keeps engaged controls independent per snapshot through the switch flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Snapshot 1: engage pedal A.
    await user.click(pedal('A'))
    expect(pedal('A')).toHaveAttribute('data-engaged', 'true')
    expect(pedal('B')).toHaveAttribute('data-engaged', 'false')

    // Add a new snapshot (clones current -> A still engaged), then engage B too.
    await user.click(screen.getByRole('button', { name: 'Add snapshot' }))
    await user.click(pedal('B'))
    expect(pedal('A')).toHaveAttribute('data-engaged', 'true')
    expect(pedal('B')).toHaveAttribute('data-engaged', 'true')

    // Back to snapshot 1: only A engaged.
    await user.click(screen.getByRole('button', { name: 'Snapshot 1' }))
    expect(pedal('A')).toHaveAttribute('data-engaged', 'true')
    expect(pedal('B')).toHaveAttribute('data-engaged', 'false')

    // Snapshot 2: both A and B engaged.
    await user.click(screen.getByRole('button', { name: 'Snapshot 2' }))
    expect(pedal('A')).toHaveAttribute('data-engaged', 'true')
    expect(pedal('B')).toHaveAttribute('data-engaged', 'true')
  })

  // Guards the first-run seeding bug: a returning user with a saved colorTheme
  // pref must have it captured into snapshot #1 rather than overwritten by the
  // hardcoded default. Switching snapshots flushes live state to localStorage.
  it('seeds snapshot #1 from saved prefs on first run (preserves colorTheme)', async () => {
    localStorage.setItem('psv-colorTheme', 'rootFocus')
    const user = userEvent.setup()
    render(<App />)

    // Force a flush of live state into the store by adding + switching.
    await user.click(screen.getByRole('button', { name: 'Add snapshot' }))
    await user.click(screen.getByRole('button', { name: 'Snapshot 1' }))

    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const model = JSON.parse(raw as string) as SnapshotsPersisted
    expect(model.snapshots[0].colorTheme).toBe('rootFocus')
  })
})
