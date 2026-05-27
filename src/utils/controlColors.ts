/** Fixed display color per control name. Pedals A/1, B/2, C/3 share a slot. */
export const CONTROL_COLORS: Record<string, string> = {
  A: '#E63946', '1': '#E63946',
  B: '#4895EF', '2': '#4895EF',
  C: '#43AA8B', '3': '#43AA8B',
  '4': '#F3722C',
  '5': '#9D4EDD',
  '6': '#FF6B9D',
  '7': '#06D6A0',
  '8': '#FFD166',
  LKL: '#8338EC',
  LKR: '#3A86FF',
  LKV: '#FB5607',
  VLOCK: '#FFBE0B',
  RKL: '#FF006E',
  RKR: '#00B4D8',
  RKR2: '#80B918',
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
