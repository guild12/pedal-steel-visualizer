import type { SnapshotState } from '../types/snapshot'

export const SNAPSHOTS_STORAGE_KEY = 'psv-snapshots-v1'

export interface SnapshotsPersisted {
  snapshots: SnapshotState[]
  activeIndex: number
}

export function loadSnapshots(): SnapshotsPersisted | null {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.snapshots) || parsed.snapshots.length === 0) {
      return null
    }
    const len = parsed.snapshots.length
    const activeIndex =
      typeof parsed.activeIndex === 'number' && parsed.activeIndex >= 0 && parsed.activeIndex < len
        ? parsed.activeIndex
        : 0
    return { snapshots: parsed.snapshots as SnapshotState[], activeIndex }
  } catch {
    return null
  }
}

export function saveSnapshots(data: SnapshotsPersisted): void {
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(data))
}
