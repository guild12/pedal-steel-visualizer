import type { Copedent } from '../types'
import { validateCopedent } from './validation'

export type ImportResult =
  | { ok: true; copedent: Copedent }
  | { ok: false; error: string }

/**
 * Parse and validate copedent JSON from a file or paste. Returns a fresh id
 * when `newId` is given so an imported file never collides with an existing
 * copedent. Shape is checked before validation so a wrong file (e.g. a
 * snapshot export) gets a clear message rather than a crash.
 */
export function parseCopedentJson(text: string, newId?: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid JSON' }
  }

  if (!isCopedentShape(parsed)) {
    return { ok: false, error: 'Not a copedent file (needs name, pedals, kneeLevers, strings)' }
  }

  const copedent: Copedent = {
    id: newId ?? parsed.id,
    name: parsed.name,
    pedals: parsed.pedals,
    kneeLevers: parsed.kneeLevers,
    strings: parsed.strings,
  }

  const errors = validateCopedent(copedent)
  if (errors.length > 0) {
    const shown = errors.slice(0, 3).map(e => e.message).join('; ')
    const more = errors.length > 3 ? ` (+${errors.length - 3} more)` : ''
    return { ok: false, error: `Invalid copedent: ${shown}${more}` }
  }

  return { ok: true, copedent }
}

function isCopedentShape(value: unknown): value is Copedent {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.name !== 'string') return false
  if (typeof v.id !== 'string') return false
  if (!Array.isArray(v.pedals) || !v.pedals.every(p => typeof p === 'string')) return false
  if (!Array.isArray(v.kneeLevers) || !v.kneeLevers.every(k => typeof k === 'string')) return false
  if (!Array.isArray(v.strings)) return false
  return v.strings.every(s => {
    if (typeof s !== 'object' || s === null) return false
    const str = s as Record<string, unknown>
    return (
      typeof str.number === 'number' &&
      typeof str.openNote === 'string' &&
      Array.isArray(str.changes) &&
      str.changes.every(c =>
        typeof c === 'object' && c !== null &&
        typeof (c as Record<string, unknown>).control === 'string' &&
        typeof (c as Record<string, unknown>).semitones === 'number',
      )
    )
  })
}
