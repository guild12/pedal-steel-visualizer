import type { Copedent } from '../types'
import { PRESETS } from '../data/presets'

export const STORAGE_KEY = 'psv-copedents'

export function loadCopedents(): Copedent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(PRESETS)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(PRESETS)
    return parsed
  } catch {
    return structuredClone(PRESETS)
  }
}

export function saveCopedents(copedents: Copedent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copedents))
}
