import type { StringChange } from '../types'

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#',
}

const SCALE_DEGREE_LABELS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'] as const

export function normalizeNoteName(name: string): string {
  return FLAT_TO_SHARP[name] ?? name
}

export function parseNote(noteStr: string): { name: string; octave: number } {
  const match = noteStr.match(/^([A-G][#b]?)(\d)$/)
  if (!match) throw new Error(`Invalid note: ${noteStr}`)
  return { name: normalizeNoteName(match[1]), octave: parseInt(match[2], 10) }
}

export function noteToMidi(noteStr: string): number {
  const { name, octave } = parseNote(noteStr)
  const semitone = NOTE_NAMES.indexOf(name as typeof NOTE_NAMES[number])
  if (semitone === -1) throw new Error(`Unknown note name: ${name}`)
  return (octave + 1) * 12 + semitone
}

export function midiToNoteName(midi: number): string {
  const index = ((midi % 12) + 12) % 12
  return NOTE_NAMES[index]
}

export function calculateFretNote(
  openNote: string,
  fret: number,
  changes: StringChange[],
  engagedControls: Set<string> = new Set(),
): string {
  const baseMidi = noteToMidi(openNote)
  const controlOffset = changes
    .filter(c => engagedControls.has(c.control))
    .reduce((sum, c) => sum + c.semitones, 0)
  return midiToNoteName(baseMidi + controlOffset + fret)
}

export function getScaleDegree(noteName: string, key: string): string {
  const noteIndex = NOTE_NAMES.indexOf(noteName as typeof NOTE_NAMES[number])
  const keyIndex = NOTE_NAMES.indexOf(key as typeof NOTE_NAMES[number])
  const interval = ((noteIndex - keyIndex) + 12) % 12
  return SCALE_DEGREE_LABELS[interval]
}

/**
 * Like calculateFretNote but returns note name with octave (e.g., "C#4").
 */
export function calculateFretNoteWithOctave(
  openNote: string,
  fret: number,
  changes: StringChange[],
  engagedControls: Set<string> = new Set(),
): string {
  const baseMidi = noteToMidi(openNote)

  let semitoneOffset = fret
  for (const change of changes) {
    if (engagedControls.has(change.control)) {
      semitoneOffset += change.semitones
    }
  }

  const resultMidi = baseMidi + semitoneOffset
  const resultName = midiToNoteName(resultMidi)
  const resultOctave = Math.floor(resultMidi / 12) - 1

  return `${resultName}${resultOctave}`
}
