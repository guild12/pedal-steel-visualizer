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
