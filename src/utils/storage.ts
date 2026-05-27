import type { Copedent } from '../types'
import { PRESETS } from '../data/presets'

export const STORAGE_KEY = 'psv-copedents'

export function loadCopedents(): Copedent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(PRESETS)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(PRESETS)
    // Self-heal: re-add any built-in preset (by id) that's missing, so the
    // defaults can't be permanently lost to an accidental delete. User edits to
    // a preset (same id) and custom copedents are preserved untouched.
    const missing = PRESETS.filter(p => !parsed.some((c: Copedent) => c.id === p.id))
    return [...structuredClone(missing), ...parsed]
  } catch {
    return structuredClone(PRESETS)
  }
}

export function saveCopedents(copedents: Copedent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copedents))
}
