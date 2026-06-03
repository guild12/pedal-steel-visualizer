import type { NoteDisplayMode, ColorTheme } from '../types'

/** One independent, serializable configuration of the visualizer. */
export interface SnapshotState {
  id: string
  activeCopedentId: string
  engagedControls: string[] // serialized form of the live Set<string>
  selectedFret: number | null
  displayMode: NoteDisplayMode
  selectedKey: string
  colorTheme: ColorTheme
  showExtensions: boolean
}
