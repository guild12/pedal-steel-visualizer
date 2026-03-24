export interface StringChange {
  control: string;
  semitones: number;
}

export interface StringConfig {
  number: number;
  openNote: string;
  changes: StringChange[];
}

export interface Copedent {
  id: string;
  name: string;
  pedals: string[];
  kneeLevers: string[];
  strings: StringConfig[];
}

export type NoteDisplayMode = 'letters' | 'scaleDegrees';

export interface AppState {
  copedents: Copedent[];
  activeCopedentId: string;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
}
