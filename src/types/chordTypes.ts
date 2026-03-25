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

export interface ChordQuality {
  root: string;
  quality: string;
  display: string;
}

export interface ChordAlternative extends ChordQuality {
  score: number;
}

export interface ChordLayers {
  core: string;
  extensions: string[];
}

export interface ChordDetectionResult {
  primary: ChordQuality;
  layers: ChordLayers;
  alternatives: ChordAlternative[];
}
