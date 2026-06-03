import type { SnapshotState } from '../types/snapshot'
import type { NoteDisplayMode, ColorTheme } from '../types'

export interface LiveValues {
  activeCopedentId: string
  engagedControls: Set<string>
  selectedFret: number | null
  displayMode: NoteDisplayMode
  selectedKey: string
  colorTheme: ColorTheme
  showExtensions: boolean
}

export interface SnapshotSetters {
  setActiveCopedentId: (id: string) => void
  setControls: (controls: string[]) => void
  setSelectedFret: (fret: number | null) => void
  setDisplayMode: (mode: NoteDisplayMode) => void
  setSelectedKey: (key: string) => void
  setColorTheme: (theme: ColorTheme) => void
  setShowExtensions: (value: boolean) => void
}

export function serializeLive(id: string, live: LiveValues): SnapshotState {
  return {
    id,
    activeCopedentId: live.activeCopedentId,
    engagedControls: [...live.engagedControls],
    selectedFret: live.selectedFret,
    displayMode: live.displayMode,
    selectedKey: live.selectedKey,
    colorTheme: live.colorTheme,
    showExtensions: live.showExtensions,
  }
}

export function applySnapshot(snap: SnapshotState, setters: SnapshotSetters): void {
  // Copedent first: switching copedent clears engaged controls in useCopedentState,
  // so controls must be applied AFTER the copedent switch or they'd be wiped.
  setters.setActiveCopedentId(snap.activeCopedentId)
  setters.setControls(snap.engagedControls)
  setters.setSelectedFret(snap.selectedFret)
  setters.setDisplayMode(snap.displayMode)
  setters.setSelectedKey(snap.selectedKey)
  setters.setColorTheme(snap.colorTheme)
  setters.setShowExtensions(snap.showExtensions)
}

export function makeDefaultSnapshot(id: string, activeCopedentId: string): SnapshotState {
  return {
    id,
    activeCopedentId,
    engagedControls: [],
    selectedFret: null,
    displayMode: 'letters',
    selectedKey: 'C',
    colorTheme: 'chordTones',
    showExtensions: true,
  }
}
