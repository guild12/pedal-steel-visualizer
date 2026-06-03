import type { SnapshotState } from '../types/snapshot'

export interface SnapshotsModel {
  snapshots: SnapshotState[]
  activeIndex: number
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.max(0, Math.min(index, length - 1))
}

export function insertAfter(
  snapshots: SnapshotState[],
  index: number,
  item: SnapshotState,
): SnapshotsModel {
  const next = snapshots.slice()
  next.splice(index + 1, 0, item)
  return { snapshots: next, activeIndex: index + 1 }
}

export function removeAt(
  snapshots: SnapshotState[],
  index: number,
  makeDefault: () => SnapshotState,
): SnapshotsModel {
  const next = snapshots.filter((_, i) => i !== index)
  if (next.length === 0) return { snapshots: [makeDefault()], activeIndex: 0 }
  return { snapshots: next, activeIndex: clampIndex(index, next.length) }
}
