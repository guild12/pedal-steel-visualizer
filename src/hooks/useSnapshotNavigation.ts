import { useEffect, useRef } from 'react'
import { useSnapshots } from './useSnapshots'
import { serializeLive, applySnapshot, makeDefaultSnapshot } from '../utils/snapshotSync'
import type { LiveValues, SnapshotSetters } from '../utils/snapshotSync'
import { insertAfter, removeAt } from '../utils/snapshotOps'
import type { SnapshotState } from '../types/snapshot'

interface Options {
  live: LiveValues
  setters: SnapshotSetters
  /** Called before a different snapshot is applied (closes transient panels). */
  onBeforeSwitch?: () => void
}

/**
 * Orchestrates the snapshot store against the live visualizer state: flushes
 * the current slot before every switch, hydrates the persisted slot on mount,
 * and exposes the navigation verbs the pager and swipe gesture need.
 */
export function useSnapshotNavigation({ live, setters, onBeforeSwitch }: Options) {
  // Seed slot #1 from the live values (which already reflect persisted prefs
  // like colorTheme) so the mount hydrate below is a harmless no-op on first run.
  const store = useSnapshots(() => serializeLive(crypto.randomUUID(), live))
  const { snapshots, activeIndex, setAll } = store

  // Restore the persisted active snapshot into the live hooks once, on mount.
  const didHydrate = useRef(false)
  useEffect(() => {
    if (didHydrate.current) return
    didHydrate.current = true
    applySnapshot(snapshots[activeIndex], setters)
    // Mount-only by design: later changes flow through the navigation verbs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Current live state written into the active slot, as a new array.
  const flushCurrent = (): SnapshotState[] => {
    const next = snapshots.slice()
    next[activeIndex] = serializeLive(snapshots[activeIndex].id, live)
    return next
  }

  const switchTo = (model: { snapshots: SnapshotState[]; activeIndex: number }) => {
    setAll(model)
    onBeforeSwitch?.()
    applySnapshot(model.snapshots[model.activeIndex], setters)
  }

  const goTo = (index: number) => {
    if (index < 0 || index >= snapshots.length || index === activeIndex) return
    switchTo({ snapshots: flushCurrent(), activeIndex: index })
  }

  const addClone = () => {
    const flushed = flushCurrent()
    const clone: SnapshotState = { ...flushed[activeIndex], id: crypto.randomUUID() }
    switchTo(insertAfter(flushed, activeIndex, clone))
  }

  const deleteCurrent = () => {
    switchTo(removeAt(snapshots, activeIndex, () =>
      makeDefaultSnapshot(crypto.randomUUID(), live.activeCopedentId),
    ))
  }

  // Swiping past the last snapshot clones the current one (Safari-tab style).
  const next = () => (activeIndex >= snapshots.length - 1 ? addClone() : goTo(activeIndex + 1))
  const prev = () => goTo(activeIndex - 1)

  return { snapshots, activeIndex, goTo, next, prev, addClone, deleteCurrent }
}
