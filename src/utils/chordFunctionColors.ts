// src/utils/chordFunctionColors.ts

/** Chord function → color mapping for note indicators */
export const CHORD_FUNCTION_COLORS: Record<string, string> = {
  root: '#00E5D0',    // Cyan — app primary accent
  '3rd': '#e63946',   // Red — defines major/minor
  'b3': '#e63946',    // Red — minor 3rd
  '5th': '#7B8CDE',   // Periwinkle — supporting tone
  'b5': '#7B8CDE',    // Periwinkle
  '#5': '#7B8CDE',    // Periwinkle
  '7th': '#F4A261',   // Orange — harmonic color
  'b7': '#F4A261',    // Orange — dominant 7th
  '6th': '#F4A261',   // Orange — similar role to 7th
  // Extensions — all purple
  '9': '#9b59b6',
  'b9': '#9b59b6',
  '#9': '#9b59b6',
  '4th': '#9b59b6',
  '11': '#9b59b6',
  '#11': '#9b59b6',
  '13': '#9b59b6',
};

/** Default color for notes not in the chord */
export const NON_CHORD_TONE_COLOR = '#444444';

/** Get the color for a chord function label, falling back to extension purple */
export function getChordFunctionColor(chordFunction: string | null): string {
  if (!chordFunction) return NON_CHORD_TONE_COLOR;
  return CHORD_FUNCTION_COLORS[chordFunction] ?? '#9b59b6';
}
