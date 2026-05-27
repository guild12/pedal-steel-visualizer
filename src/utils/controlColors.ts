// Pedals use a WARM family and knee levers use a COOL family, so a pedal can
// never share (or be confused with) a knee-lever color. Pedals A/1, B/2, C/3
// share a slot (lettered vs numbered naming for the same pedal).
export const CONTROL_COLORS: Record<string, string> = {
  // Pedals — warm (reds / oranges / yellows / pinks)
  A: '#E63946', '1': '#E63946', // red
  B: '#FB8500', '2': '#FB8500', // orange
  C: '#FFB703', '3': '#FFB703', // amber
  '4': '#FFD60A',               // yellow
  '5': '#FF5DA2',               // pink
  '6': '#C81D6B',               // magenta
  '7': '#F3722C',               // burnt orange
  '8': '#D00000',               // deep red
  // Knee levers — cool (blues / greens / purples)
  LKL: '#4361EE',   // blue
  LKR: '#4CC9F0',   // sky
  LKV: '#06D6A0',   // mint
  VLOCK: '#3A0CA3', // indigo
  RKL: '#2A9D8F',   // teal
  RKR: '#7B2CBF',   // purple
  RKR2: '#80B918',  // lime
}

const FALLBACK_PALETTE = [
  '#E76F51', '#2A9D8F', '#E9C46A', '#264653',
  '#A8DADC', '#BC6C25', '#588157', '#6D597A',
]

/** Stable color for a control name: fixed map, else a hashed palette slot. */
export function getControlColor(name: string): string {
  const fixed = CONTROL_COLORS[name]
  if (fixed) return fixed
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length]
}

/** Readable text color (dark or white) for text placed on the given hex bg. */
export function readableTextColor(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Perceived (sRGB-weighted) luminance, 0-1.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#fff'
}
