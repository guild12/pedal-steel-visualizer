export const TOTAL_FRETS = 12

export const FRET_MARKER_FRETS = [3, 5, 7, 9, 12]
export const DOUBLE_DOT_FRETS = new Set([12])

/**
 * Calculate fret X position using even spacing.
 * On pedal steel, the bar sits directly on the fret line,
 * so frets are evenly spaced with notes centered on each line.
 */
export function getFretX(fret: number, totalWidth: number): number {
  return (fret / TOTAL_FRETS) * totalWidth
}

/**
 * Calculate Y position for a string (0-indexed).
 * String 0 is at the top (highest pitch), last string at the bottom (lowest pitch).
 */
export function getStringY(
  stringIndex: number,
  totalStrings: number,
  fretboardHeight: number,
  paddingY: number = 20,
): number {
  if (totalStrings <= 1) return fretboardHeight / 2
  const usableHeight = fretboardHeight - paddingY * 2
  const spacing = usableHeight / (totalStrings - 1)
  return paddingY + stringIndex * spacing
}

/**
 * String thickness — thicker for lower-pitched strings (higher index).
 */
export function getStringThickness(stringIndex: number, totalStrings: number): number {
  if (totalStrings <= 1) return 2
  const min = 1
  const max = 3
  return min + (stringIndex / (totalStrings - 1)) * (max - min)
}
