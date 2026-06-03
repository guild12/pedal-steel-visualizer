import { useState, useCallback, useEffect } from 'react'
import type { SnapshotState } from '../types/snapshot'
import type { SnapshotsModel } from '../utils/snapshotOps'
import { loadSnapshots, saveSnapshots } from '../utils/snapshotStorage'

export function useSnapshots(makeSeed: () => SnapshotState) {
  const [model, setModel] = useState<SnapshotsModel>(() => {
    const loaded = loadSnapshots()
    if (loaded) return loaded
    return { snapshots: [makeSeed()], activeIndex: 0 }
  })

  useEffect(() => {
    saveSnapshots(model)
  }, [model])

  const setAll = useCallback((next: SnapshotsModel) => {
    setModel(next)
  }, [])

  return {
    snapshots: model.snapshots,
    activeIndex: model.activeIndex,
    setAll,
  }
}
