// src/types/chordTypes.ts

export interface ChordName {
  root: string;
  quality: string;
  display: string;
}

export interface ScoredChordName extends ChordName {
  score: number;
}

export interface ChordLayers {
  core: string;
  extensions: string[];
}

export interface ChordDetectionResult {
  primary: ChordName;
  layers: ChordLayers;
  alternatives: ScoredChordName[];
}

export interface ChordDefinition {
  quality: string;
  intervals: number[];
}

export interface VoicingNote {
  stringNumber: number;
  note: string;
  pitchClass: string;
  chordFunction: string | null;
  isAlteredByControl: boolean;
  alteredBy: string | null;
}

export interface VoicingScore {
  completeness: number;
  simplicity: number;
  combined: number;
}

export interface VoicingResult {
  fret: number;
  engagedControls: string[];
  notes: VoicingNote[];
  score: VoicingScore;
}

export interface ControlChange {
  control: string;
  action: 'press' | 'release';
}

export interface TransitionEffort {
  fretDistance: number;
  controlChanges: ControlChange[];
  commonTones: number;
  totalScore: number;
}

export interface TransitionResult {
  from: VoicingResult;
  to: VoicingResult;
  effort: TransitionEffort;
}

/** Minimal shape needed to score a move: a fret, engaged controls, and per-string pitch classes. */
export interface EffortPosition {
  fret: number;
  engagedControls: string[];
  notes: { pitchClass: string }[];
}

/** A candidate target voicing paired with the effort to reach it from the current position. */
export interface ScoredMove {
  target: VoicingResult;
  effort: TransitionEffort;
}

export interface ChordFinderState {
  active: boolean;
  targetChord: { root: string; quality: string } | null;
  results: VoicingResult[];
}

export interface ChordTransitionState {
  active: boolean;
  chordA: { root: string; quality: string } | null;
  chordB: { root: string; quality: string } | null;
  results: TransitionResult[];
  selectedResultIndex: number | null;
}

export interface MoveToState {
  active: boolean;
  targetChord: { root: string; quality: string } | null;
  inspectedIndex: number | null;
}

export interface ChordState {
  selectedFret: number | null;
  chordFinder: ChordFinderState | null;
  chordTransition: ChordTransitionState | null;
}
