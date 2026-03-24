export const TOTAL_FRETS = 24

export const FRET_MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
export const DOUBLE_DOT_FRETS = new Set([12, 24])

/**
 * Calculate fret X position using real scale-length formula.
 * Position = scaleLength * (1 - 1 / 2^(fret/12))
 * Normalized to fit within totalWidth.
 */
export function getFretX(fret: number, totalWidth: number): number {
  if (fret === 0) return 0
  const maxPos = 1 - 1 / Math.pow(2, TOTAL_FRETS / 12)
  const pos = 1 - 1 / Math.pow(2, fret / 12)
  return (pos / maxPos) * totalWidth
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
