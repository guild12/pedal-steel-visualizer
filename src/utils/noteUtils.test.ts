import { describe, it, expect } from 'vitest'
import {
  parseNote,
  noteToMidi,
  midiToNoteName,
  normalizeNoteName,
  calculateFretNote,
  getScaleDegree,
} from './noteUtils'

describe('parseNote', () => {
  it('parses sharp note with octave', () => {
    expect(parseNote('F#4')).toEqual({ name: 'F#', octave: 4 })
  })
  it('parses natural note with octave', () => {
    expect(parseNote('C3')).toEqual({ name: 'C', octave: 3 })
  })
  it('parses single-digit octave', () => {
    expect(parseNote('B6')).toEqual({ name: 'B', octave: 6 })
  })
})

describe('normalizeNoteName', () => {
  it('converts Bb to A#', () => { expect(normalizeNoteName('Bb')).toBe('A#') })
  it('converts Eb to D#', () => { expect(normalizeNoteName('Eb')).toBe('D#') })
  it('passes through sharp notes unchanged', () => { expect(normalizeNoteName('F#')).toBe('F#') })
  it('passes through natural notes unchanged', () => { expect(normalizeNoteName('C')).toBe('C') })
  it('converts Gb to F#', () => { expect(normalizeNoteName('Gb')).toBe('F#') })
  it('converts Db to C#', () => { expect(normalizeNoteName('Db')).toBe('C#') })
  it('converts Ab to G#', () => { expect(normalizeNoteName('Ab')).toBe('G#') })
})

describe('noteToMidi', () => {
  it('returns 60 for C4 (middle C)', () => { expect(noteToMidi('C4')).toBe(60) })
  it('returns 69 for A4 (concert A)', () => { expect(noteToMidi('A4')).toBe(69) })
  it('returns 40 for E2', () => { expect(noteToMidi('E2')).toBe(40) })
  it('returns 66 for F#4', () => { expect(noteToMidi('F#4')).toBe(66) })
})

describe('midiToNoteName', () => {
  it('returns C for midi 60', () => { expect(midiToNoteName(60)).toBe('C') })
  it('returns F# for midi 66', () => { expect(midiToNoteName(66)).toBe('F#') })
  it('returns A for midi 69', () => { expect(midiToNoteName(69)).toBe('A') })
})

describe('calculateFretNote', () => {
  it('returns open note at fret 0 with no controls', () => {
    expect(calculateFretNote('E2', 0, [])).toBe('E')
  })
  it('returns note one semitone up at fret 1', () => {
    expect(calculateFretNote('E2', 1, [])).toBe('F')
  })
  it('returns note 12 semitones up at fret 12', () => {
    expect(calculateFretNote('E2', 12, [])).toBe('E')
  })
  it('applies positive semitone changes from engaged controls', () => {
    const changes = [{ control: 'A', semitones: 2 }]
    expect(calculateFretNote('E2', 0, changes, new Set(['A']))).toBe('F#')
  })
  it('applies negative semitone changes', () => {
    const changes = [{ control: 'B', semitones: -1 }]
    expect(calculateFretNote('E2', 0, changes, new Set(['B']))).toBe('D#')
  })
  it('sums multiple engaged control changes additively', () => {
    const changes = [
      { control: 'A', semitones: 2 },
      { control: 'LKL', semitones: -1 },
    ]
    expect(calculateFretNote('E2', 0, changes, new Set(['A', 'LKL']))).toBe('F')
  })
  it('ignores non-engaged controls', () => {
    const changes = [
      { control: 'A', semitones: 2 },
      { control: 'B', semitones: -1 },
    ]
    expect(calculateFretNote('E2', 0, changes, new Set(['A']))).toBe('F#')
  })
})

describe('getScaleDegree', () => {
  it('returns 1 for root note', () => { expect(getScaleDegree('C', 'C')).toBe('1') })
  it('returns b3 for minor third', () => { expect(getScaleDegree('D#', 'C')).toBe('b3') })
  it('returns 5 for perfect fifth', () => { expect(getScaleDegree('G', 'C')).toBe('5') })
  it('returns b7 for minor seventh', () => { expect(getScaleDegree('A#', 'C')).toBe('b7') })
  it('works with non-C keys', () => { expect(getScaleDegree('E', 'A')).toBe('5') })
})
