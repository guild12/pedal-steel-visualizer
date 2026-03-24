import type { Copedent } from '../types'
import { noteToMidi } from './noteUtils'

export interface ValidationError {
  field: string;
  message: string;
}

const MIN_MIDI = noteToMidi('C1')
const MAX_MIDI = noteToMidi('C7')

export function validateCopedent(copedent: Copedent): ValidationError[] {
  const errors: ValidationError[] = []

  if (!copedent.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' })
  }
  if (copedent.strings.length < 1 || copedent.strings.length > 14) {
    errors.push({ field: 'strings', message: 'String count must be 1-14' })
  }
  if (copedent.pedals.length > 12) {
    errors.push({ field: 'pedals', message: 'Maximum 12 pedals' })
  }
  if (copedent.kneeLevers.length > 12) {
    errors.push({ field: 'kneeLevers', message: 'Maximum 12 knee levers' })
  }

  const allControls = new Set([...copedent.pedals, ...copedent.kneeLevers])

  copedent.strings.forEach((s, si) => {
    try {
      const midi = noteToMidi(s.openNote)
      if (midi < MIN_MIDI || midi > MAX_MIDI) {
        errors.push({ field: `strings[${si}].openNote`, message: `Open note out of range (C1-C7)` })
      }
    } catch {
      errors.push({ field: `strings[${si}].openNote`, message: `Invalid note: ${s.openNote}` })
    }

    const seenControls = new Set<string>()
    s.changes.forEach((c, ci) => {
      if (c.semitones === 0) {
        errors.push({ field: `strings[${si}].changes[${ci}].semitones`, message: 'Semitones must be non-zero' })
      }
      if (seenControls.has(c.control)) {
        errors.push({ field: `strings[${si}].changes[${ci}]`, message: `String ${s.number} has duplicate control "${c.control}"` })
      }
      seenControls.add(c.control)
      if (!allControls.has(c.control)) {
        errors.push({ field: `strings[${si}].changes[${ci}].control`, message: `String ${s.number} references unknown control "${c.control}"` })
      }
    })
  })

  return errors
}
