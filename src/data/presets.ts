import type { Copedent } from '../types'

// Standard Emmons E9 copedent (10-string, 3 pedals, 5 knee levers)
// Reference: Standard Buddy Emmons E9 setup
// NOTE: Verify these values against a published Emmons E9 copedent chart
// before shipping.
export const E9_PRESET: Copedent = {
  id: 'preset-e9',
  name: 'Emmons E9',
  pedals: ['A', 'B', 'C'],
  kneeLevers: ['LKL', 'LKR', 'RKL', 'RKR', 'RKR2'],
  strings: [
    { number: 1, openNote: 'F#4', changes: [] },
    { number: 2, openNote: 'D#4', changes: [
      { control: 'A', semitones: 1 },
      { control: 'LKR', semitones: -1 },
    ]},
    { number: 3, openNote: 'G#3', changes: [
      { control: 'B', semitones: 1 },
      { control: 'RKR', semitones: -1 },
    ]},
    { number: 4, openNote: 'E3', changes: [
      { control: 'B', semitones: 2 },
      { control: 'RKL', semitones: 1 },
    ]},
    { number: 5, openNote: 'B3', changes: [
      { control: 'A', semitones: 2 },
      { control: 'C', semitones: 1 },
      { control: 'LKL', semitones: -1 },
    ]},
    { number: 6, openNote: 'G#3', changes: [
      { control: 'A', semitones: 1 },
      { control: 'C', semitones: -1 },
      { control: 'LKL', semitones: 2 },
    ]},
    { number: 7, openNote: 'F#3', changes: [
      { control: 'LKR', semitones: -1 },
    ]},
    { number: 8, openNote: 'E3', changes: [
      { control: 'RKL', semitones: 1 },
      { control: 'RKR2', semitones: -1 },
    ]},
    { number: 9, openNote: 'D3', changes: [
      { control: 'C', semitones: 1 },
    ]},
    { number: 10, openNote: 'B2', changes: [
      { control: 'A', semitones: 2 },
      { control: 'C', semitones: 1 },
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
