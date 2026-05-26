import type { Copedent } from '../types'

// Standard Emmons E9 copedent (10-string, 3 pedals, 5 knee levers)
// Reference: standard Buddy Emmons / Jeff Newman E9 setup.
// Open tuning (1 high -> 10 low): F#4 D#4 G#4 E4 B3 G#3 F#3 E3 D3 B2
// A: 5,10 +2 (B->C#)  B: 3,6 +1 (G#->A)  C: 4,5 +2 (E->F#, B->C#)
// LKL: 4,8 +1 (E->F)  LKR: 4,8 -1 (E->Eb)  RKL: 1,7 +1 (F#->G)
// RKR: 2,9 -1 (D#->D, D->C#)  RKR2: 2 -2 split (D#->C#)
export const E9_PRESET: Copedent = {
  id: 'preset-e9',
  name: 'Emmons E9',
  pedals: ['A', 'B', 'C'],
  kneeLevers: ['LKL', 'LKR', 'RKL', 'RKR', 'RKR2'],
  strings: [
    { number: 1, openNote: 'F#4', changes: [
      { control: 'RKL', semitones: 1 },
    ]},
    { number: 2, openNote: 'D#4', changes: [
      { control: 'RKR', semitones: -1 },
      { control: 'RKR2', semitones: -2 },
    ]},
    { number: 3, openNote: 'G#4', changes: [
      { control: 'B', semitones: 1 },
    ]},
    { number: 4, openNote: 'E4', changes: [
      { control: 'C', semitones: 2 },
      { control: 'LKL', semitones: 1 },
      { control: 'LKR', semitones: -1 },
    ]},
    { number: 5, openNote: 'B3', changes: [
      { control: 'A', semitones: 2 },
      { control: 'C', semitones: 2 },
    ]},
    { number: 6, openNote: 'G#3', changes: [
      { control: 'B', semitones: 1 },
    ]},
    { number: 7, openNote: 'F#3', changes: [
      { control: 'RKL', semitones: 1 },
    ]},
    { number: 8, openNote: 'E3', changes: [
      { control: 'LKL', semitones: 1 },
      { control: 'LKR', semitones: -1 },
    ]},
    { number: 9, openNote: 'D3', changes: [
      { control: 'RKR', semitones: -1 },
    ]},
    { number: 10, openNote: 'B2', changes: [
      { control: 'A', semitones: 2 },
    ]},
  ],
}

// Standard Emmons C6 copedent (10-string, 5 pedals, 4 knee levers)
export const C6_PRESET: Copedent = {
  id: 'preset-c6',
  name: 'Emmons C6',
  pedals: ['1', '2', '3', '4', '5'],
  kneeLevers: ['LKL', 'LKR', 'RKL', 'RKR'],
  strings: [
    { number: 1, openNote: 'C4', changes: [
      { control: '4', semitones: 2 },
      { control: '5', semitones: 1 },
    ]},
    { number: 2, openNote: 'A3', changes: [
      { control: '1', semitones: 2 },
      { control: 'RKR', semitones: -1 },
    ]},
    { number: 3, openNote: 'G3', changes: [
      { control: '2', semitones: 2 },
      { control: 'LKL', semitones: -1 },
    ]},
    { number: 4, openNote: 'E3', changes: [
      { control: '3', semitones: 1 },
      { control: 'LKR', semitones: -1 },
    ]},
    { number: 5, openNote: 'C3', changes: [
      { control: '4', semitones: 2 },
      { control: '5', semitones: 1 },
    ]},
    { number: 6, openNote: 'A3', changes: [
      { control: '1', semitones: 2 },
      { control: 'RKL', semitones: 1 },
    ]},
    { number: 7, openNote: 'G3', changes: [
      { control: '2', semitones: 2 },
    ]},
    { number: 8, openNote: 'E3', changes: [
      { control: '3', semitones: 1 },
    ]},
    { number: 9, openNote: 'C3', changes: [] },
    { number: 10, openNote: 'A2', changes: [
      { control: '1', semitones: 2 },
    ]},
  ],
}

export const PRESETS: Copedent[] = [E9_PRESET, C6_PRESET]
