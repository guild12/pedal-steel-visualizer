// src/utils/chordFunctionColors.ts
import type { ColorTheme } from '../types';

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

// Core tones: root, 3rd, b3, 5th, b5, #5, 6th, 7th, b7
const CORE_FUNCTIONS = new Set([
  'root', '3rd', 'b3', '5th', 'b5', '#5', '6th', '7th', 'b7',
]);

const CHORD_TONES_PALETTE = {
  core: '#00E5D0',      // cyan
  extension: '#F4A261', // orange
} as const;

const ROOT_FOCUS_PALETTE = {
  root: '#00E5D0',      // cyan
  core: '#7B8CDE',      // periwinkle
  extension: '#F4A261', // orange
} as const;

/** Extension color per theme — the fundamental rule: extensions always get this color */
const EXTENSION_COLORS: Record<ColorTheme, string> = {
  chordTones: '#F4A261',  // orange
  rootFocus: '#F4A261',   // orange
  perFunction: '#9b59b6', // purple
};

/**
 * Resolve the display color for a chord function label under the given theme.
 * Returns null when chordFunction is null (non-chord notes — callers handle styling).
 *
 * Fundamental rule: when isExtension is true, the note always gets the theme's
 * extension color regardless of its function label. This ensures that e.g. a b5
 * extension is visually distinct from a core 5th, even if they're in the same
 * function family. Future themes get this behavior automatically.
 */
export function resolveChordColor(
  chordFunction: string | null,
  theme: ColorTheme,
  isExtension = false,
): string | null {
  if (chordFunction === null) return null;

  // Fundamental rule: extensions always get the extension color
  if (isExtension) return EXTENSION_COLORS[theme];

  switch (theme) {
    case 'chordTones':
      return CORE_FUNCTIONS.has(chordFunction)
        ? CHORD_TONES_PALETTE.core
        : CHORD_TONES_PALETTE.extension;

    case 'rootFocus':
      if (chordFunction === 'root') return ROOT_FOCUS_PALETTE.root;
      return CORE_FUNCTIONS.has(chordFunction)
        ? ROOT_FOCUS_PALETTE.core
        : ROOT_FOCUS_PALETTE.extension;

    case 'perFunction':
      return CHORD_FUNCTION_COLORS[chordFunction] ?? '#9b59b6';
  }
}
