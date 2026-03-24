# Pedal Steel Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based pedal steel guitar fretboard visualizer with custom copedent editing, real-time pedal/lever interaction, and SVG rendering.

**Architecture:** React app with all state at the App level flowing down as props. The Fretboard is pure derived state — it receives computed note data and renders SVG. Core note math and copedent validation live in pure utility modules, fully testable without React. localStorage provides persistence with no backend.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, Tailwind CSS, SVG

**Spec:** `docs/2026-03-24-pedal-steel-visualizer-design.md`

---

## File Structure

```
pedal-steel-visualizer/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                          # Tailwind directives
│   ├── types.ts                           # Copedent, StringConfig, StringChange, AppState
│   ├── utils/
│   │   ├── noteUtils.ts                   # note parsing, transposition, scale degrees
│   │   ├── noteUtils.test.ts
│   │   ├── validation.ts                  # copedent validation
│   │   ├── validation.test.ts
│   │   ├── fretUtils.ts                   # fret position calculations
│   │   ├── fretUtils.test.ts
│   │   ├── storage.ts                     # localStorage CRUD
│   │   └── storage.test.ts
│   ├── data/
│   │   ├── presets.ts                     # E9 and C6 standard copedents
│   │   └── presets.test.ts
│   ├── components/
│   │   ├── Fretboard/
│   │   │   ├── Fretboard.tsx              # main SVG container, layout math
│   │   │   ├── FretLines.tsx              # nut + fret vertical lines
│   │   │   ├── StringLines.tsx            # horizontal string lines with variable thickness
│   │   │   ├── NoteIndicators.tsx         # circles with note text at each position
│   │   │   ├── FretMarkers.tsx            # dot markers at standard fret positions
│   │   │   └── Fretboard.test.tsx
│   │   ├── ControlPanel/
│   │   │   ├── ControlPanel.tsx           # pedal + lever toggles + display options
│   │   │   ├── ToggleButton.tsx           # single toggle button (shared by pedals + levers)
│   │   │   ├── DisplayOptions.tsx         # note mode toggle + key selector
│   │   │   └── ControlPanel.test.tsx
│   │   ├── CopedentEditor/
│   │   │   ├── CopedentEditor.tsx         # scrollable form container
│   │   │   ├── GuitarConfig.tsx           # name, pedals, levers, string count
│   │   │   ├── StringSetup.tsx            # open note per string
│   │   │   ├── ChangesMatrix.tsx          # string × control grid
│   │   │   ├── ImportExport.tsx           # JSON paste/copy
│   │   │   └── CopedentEditor.test.tsx
│   │   └── CopedentManager/
│   │       ├── CopedentManager.tsx        # selector dropdown, create/duplicate/delete
│   │       └── CopedentManager.test.tsx
│   └── hooks/
│       ├── useCopedentState.ts            # main app state hook
│       └── useCopedentState.test.ts
└── docs/
    └── (existing design spec)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd pedal-steel-visualizer
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure Tailwind**

Replace `src/index.css`:

```css
@import "tailwindcss";
```

Add Tailwind plugin to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

Add to `tsconfig.app.json` compilerOptions:

```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: Create minimal App shell**

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <h1 className="text-2xl font-bold">Pedal Steel Visualizer</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: App loads at localhost:5173 with dark background and title.

- [ ] **Step 7: Verify tests run**

```bash
npx vitest run
```

Expected: No test files found (yet), exits clean.

- [ ] **Step 8: Delete boilerplate files**

Remove: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Clean any imports referencing them.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind + Vitest"
```

---

## Task 2: Types & Note Utilities

**Files:**
- Create: `src/types.ts`, `src/utils/noteUtils.ts`, `src/utils/noteUtils.test.ts`

- [ ] **Step 1: Define TypeScript interfaces**

Create `src/types.ts`:

```typescript
export interface StringChange {
  control: string;
  semitones: number;
}

export interface StringConfig {
  number: number;
  openNote: string;
  changes: StringChange[];
}

export interface Copedent {
  id: string;
  name: string;
  pedals: string[];
  kneeLevers: string[];
  strings: StringConfig[];
}

export type NoteDisplayMode = 'letters' | 'scaleDegrees';

export interface AppState {
  copedents: Copedent[];
  activeCopedentId: string;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
}
```

- [ ] **Step 2: Write failing tests for note parsing**

Create `src/utils/noteUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  parseNote,
  noteToMidi,
  midiToNoteName,
  normalizeNoteName,
  calculateFretNote,
  getScaleDegree,
  NOTE_NAMES,
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
  it('converts Bb to A#', () => {
    expect(normalizeNoteName('Bb')).toBe('A#')
  })

  it('converts Eb to D#', () => {
    expect(normalizeNoteName('Eb')).toBe('D#')
  })

  it('passes through sharp notes unchanged', () => {
    expect(normalizeNoteName('F#')).toBe('F#')
  })

  it('passes through natural notes unchanged', () => {
    expect(normalizeNoteName('C')).toBe('C')
  })

  it('converts Gb to F#', () => {
    expect(normalizeNoteName('Gb')).toBe('F#')
  })

  it('converts Db to C#', () => {
    expect(normalizeNoteName('Db')).toBe('C#')
  })

  it('converts Ab to G#', () => {
    expect(normalizeNoteName('Ab')).toBe('G#')
  })
})

describe('noteToMidi', () => {
  it('returns 60 for C4 (middle C)', () => {
    expect(noteToMidi('C4')).toBe(60)
  })

  it('returns 69 for A4 (concert A)', () => {
    expect(noteToMidi('A4')).toBe(69)
  })

  it('returns 40 for E2', () => {
    expect(noteToMidi('E2')).toBe(40)
  })

  it('returns 66 for F#4', () => {
    expect(noteToMidi('F#4')).toBe(66)
  })
})

describe('midiToNoteName', () => {
  it('returns C4 for midi 60', () => {
    expect(midiToNoteName(60)).toBe('C')
  })

  it('returns F# for midi 66', () => {
    expect(midiToNoteName(66)).toBe('F#')
  })

  it('returns A for midi 69', () => {
    expect(midiToNoteName(69)).toBe('A')
  })
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
    // E2 + 2 semitones = F#2, at fret 0
    const changes = [{ control: 'A', semitones: 2 }]
    expect(calculateFretNote('E2', 0, changes, new Set(['A']))).toBe('F#')
  })

  it('applies negative semitone changes', () => {
    // E2 - 1 = D#2 at fret 0
    const changes = [{ control: 'B', semitones: -1 }]
    expect(calculateFretNote('E2', 0, changes, new Set(['B']))).toBe('D#')
  })

  it('sums multiple engaged control changes additively', () => {
    // E2 + 2 - 1 = F2 at fret 0
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
    // Only A engaged: E2 + 2 = F#2
    expect(calculateFretNote('E2', 0, changes, new Set(['A']))).toBe('F#')
  })
})

describe('getScaleDegree', () => {
  it('returns 1 for root note', () => {
    expect(getScaleDegree('C', 'C')).toBe('1')
  })

  it('returns b3 for minor third', () => {
    expect(getScaleDegree('D#', 'C')).toBe('b3')
  })

  it('returns 5 for perfect fifth', () => {
    expect(getScaleDegree('G', 'C')).toBe('5')
  })

  it('returns b7 for minor seventh', () => {
    expect(getScaleDegree('A#', 'C')).toBe('b7')
  })

  it('works with non-C keys', () => {
    expect(getScaleDegree('E', 'A')).toBe('5')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/utils/noteUtils.test.ts
```

Expected: FAIL — module `./noteUtils` not found.

- [ ] **Step 4: Implement note utilities**

Create `src/utils/noteUtils.ts`:

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/utils/noteUtils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/utils/noteUtils.ts src/utils/noteUtils.test.ts
git commit -m "feat: add types and note calculation utilities"
```

---

## Task 3: Copedent Validation

**Files:**
- Create: `src/utils/validation.ts`, `src/utils/validation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateCopedent, ValidationError } from './validation'
import type { Copedent } from '../types'

function makeCopedent(overrides: Partial<Copedent> = {}): Copedent {
  return {
    id: 'test-id',
    name: 'Test',
    pedals: ['A', 'B'],
    kneeLevers: ['LKL'],
    strings: [
      { number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 1 }] },
    ],
    ...overrides,
  }
}

describe('validateCopedent', () => {
  it('returns no errors for valid copedent', () => {
    expect(validateCopedent(makeCopedent())).toEqual([])
  })

  it('rejects zero semitones', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 0 }] }],
    })
    const errors = validateCopedent(cop)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('strings[0].changes[0].semitones')
  })

  it('rejects duplicate control on same string', () => {
    const cop = makeCopedent({
      strings: [{
        number: 1, openNote: 'E4',
        changes: [
          { control: 'A', semitones: 1 },
          { control: 'A', semitones: -1 },
        ],
      }],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('duplicate'))).toBe(true)
  })

  it('rejects string count > 14', () => {
    const strings = Array.from({ length: 15 }, (_, i) => ({
      number: i + 1, openNote: 'E4', changes: [],
    }))
    const errors = validateCopedent(makeCopedent({ strings }))
    expect(errors.some(e => e.field === 'strings')).toBe(true)
  })

  it('rejects string count < 1', () => {
    const errors = validateCopedent(makeCopedent({ strings: [] }))
    expect(errors.some(e => e.field === 'strings')).toBe(true)
  })

  it('rejects more than 12 pedals', () => {
    const pedals = Array.from({ length: 13 }, (_, i) => `P${i}`)
    const errors = validateCopedent(makeCopedent({ pedals }))
    expect(errors.some(e => e.field === 'pedals')).toBe(true)
  })

  it('rejects more than 12 knee levers', () => {
    const kneeLevers = Array.from({ length: 13 }, (_, i) => `K${i}`)
    const errors = validateCopedent(makeCopedent({ kneeLevers }))
    expect(errors.some(e => e.field === 'kneeLevers')).toBe(true)
  })

  it('rejects open note outside C1-C7 range', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'C0', changes: [] }],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('range'))).toBe(true)
  })

  it('rejects empty name', () => {
    const errors = validateCopedent(makeCopedent({ name: '' }))
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })

  it('rejects change referencing non-existent control', () => {
    const cop = makeCopedent({
      strings: [{ number: 1, openNote: 'E4', changes: [{ control: 'Z', semitones: 1 }] }],
    })
    const errors = validateCopedent(cop)
    expect(errors.some(e => e.message.includes('unknown control'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/validation.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validation**

Create `src/utils/validation.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/validation.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts src/utils/validation.test.ts
git commit -m "feat: add copedent validation with full rule coverage"
```

---

## Task 4: Preset Copedents (E9 & C6)

**Files:**
- Create: `src/data/presets.ts`, `src/data/presets.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/data/presets.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { E9_PRESET, C6_PRESET } from './presets'
import { validateCopedent } from '../utils/validation'

describe('E9 preset', () => {
  it('has 10 strings', () => {
    expect(E9_PRESET.strings).toHaveLength(10)
  })

  it('has standard E9 pedals (A, B, C)', () => {
    expect(E9_PRESET.pedals).toEqual(expect.arrayContaining(['A', 'B', 'C']))
  })

  it('has knee levers', () => {
    expect(E9_PRESET.kneeLevers.length).toBeGreaterThan(0)
  })

  it('passes validation', () => {
    expect(validateCopedent(E9_PRESET)).toEqual([])
  })

  it('has correct open string 1 (F#4)', () => {
    expect(E9_PRESET.strings[0].openNote).toBe('F#4')
  })
})

describe('C6 preset', () => {
  it('has 10 strings', () => {
    expect(C6_PRESET.strings).toHaveLength(10)
  })

  it('passes validation', () => {
    expect(validateCopedent(C6_PRESET)).toEqual([])
  })

  it('has correct open string 1 (C4)', () => {
    expect(C6_PRESET.strings[0].openNote).toBe('C4')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/data/presets.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement presets**

Create `src/data/presets.ts`:

```typescript
import type { Copedent } from '../types'

// Standard Emmons E9 copedent (10-string, 3 pedals, 5 knee levers)
// Reference: Standard Buddy Emmons E9 setup
// NOTE: Verify these values against a published Emmons E9 copedent chart
// before shipping. The implementer should cross-check with a reference like
// https://b0b.com/steel/ or a printed copedent chart book. Pedal steel
// copedents are highly standardized but vary slightly by builder — use the
// "standard Emmons" variant.
export const E9_PRESET: Copedent = {
  id: 'preset-e9',
  name: 'Emmons E9',
  pedals: ['A', 'B', 'C'],
  kneeLevers: ['LKL', 'LKR', 'RKL', 'RKR', 'RKR2'],
  strings: [
    {
      number: 1, openNote: 'F#4',
      changes: [],
    },
    {
      number: 2, openNote: 'D#4',
      changes: [
        { control: 'A', semitones: 1 },   // D# → E
        { control: 'LKR', semitones: -1 }, // D# → D
      ],
    },
    {
      number: 3, openNote: 'G#3',
      changes: [
        { control: 'B', semitones: 1 },   // G# → A
        { control: 'RKR', semitones: -1 }, // G# → G
      ],
    },
    {
      number: 4, openNote: 'E3',
      changes: [
        { control: 'B', semitones: 2 },   // E → F#
        { control: 'RKL', semitones: 1 }, // E → F
      ],
    },
    {
      number: 5, openNote: 'B3',
      changes: [
        { control: 'A', semitones: 2 },   // B → C#
        { control: 'C', semitones: 1 },   // B → C
        { control: 'LKL', semitones: -1 }, // B → A#/Bb
      ],
    },
    {
      number: 6, openNote: 'G#3',
      changes: [
        { control: 'A', semitones: 1 },   // G# → A
        { control: 'C', semitones: -1 },  // G# → G
        { control: 'LKL', semitones: 2 }, // G# → A#/Bb
      ],
    },
    {
      number: 7, openNote: 'F#3',
      changes: [
        { control: 'LKR', semitones: -1 }, // F# → F
      ],
    },
    {
      number: 8, openNote: 'E3',
      changes: [
        { control: 'RKL', semitones: 1 },  // E → F
        { control: 'RKR2', semitones: -1 }, // E → D#/Eb
      ],
    },
    {
      number: 9, openNote: 'D3',
      changes: [
        { control: 'C', semitones: 1 },   // D → D#/Eb
      ],
    },
    {
      number: 10, openNote: 'B2',
      changes: [
        { control: 'A', semitones: 2 },   // B → C#
        { control: 'C', semitones: 1 },   // B → C
      ],
    },
  ],
}

// Standard Emmons C6 copedent (10-string, 5 pedals, 4 knee levers)
// NOTE: Same verification advice as E9 — cross-check against a published
// Emmons C6 copedent chart before shipping.
export const C6_PRESET: Copedent = {
  id: 'preset-c6',
  name: 'Emmons C6',
  pedals: ['1', '2', '3', '4', '5'],
  kneeLevers: ['LKL', 'LKR', 'RKL', 'RKR'],
  strings: [
    {
      number: 1, openNote: 'C4',
      changes: [
        { control: '4', semitones: 2 },   // C → D
        { control: '5', semitones: 1 },   // C → C#
      ],
    },
    {
      number: 2, openNote: 'A3',
      changes: [
        { control: '1', semitones: 2 },   // A → B
        { control: 'RKR', semitones: -1 }, // A → G#
      ],
    },
    {
      number: 3, openNote: 'G3',
      changes: [
        { control: '2', semitones: 2 },   // G → A
        { control: 'LKL', semitones: -1 }, // G → F#
      ],
    },
    {
      number: 4, openNote: 'E3',
      changes: [
        { control: '3', semitones: 1 },   // E → F
        { control: 'LKR', semitones: -1 }, // E → D#
      ],
    },
    {
      number: 5, openNote: 'C3',
      changes: [
        { control: '4', semitones: 2 },   // C → D
        { control: '5', semitones: 1 },   // C → C#
      ],
    },
    {
      number: 6, openNote: 'A3',
      changes: [
        { control: '1', semitones: 2 },   // A → B
        { control: 'RKL', semitones: 1 }, // A → A#
      ],
    },
    {
      number: 7, openNote: 'G3',
      changes: [
        { control: '2', semitones: 2 },   // G → A
      ],
    },
    {
      number: 8, openNote: 'E3',
      changes: [
        { control: '3', semitones: 1 },   // E → F
      ],
    },
    {
      number: 9, openNote: 'C3',
      changes: [],
    },
    {
      number: 10, openNote: 'A2',
      changes: [
        { control: '1', semitones: 2 },   // A → B
      ],
    },
  ],
}

export const PRESETS: Copedent[] = [E9_PRESET, C6_PRESET]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/data/presets.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/presets.ts src/data/presets.test.ts
git commit -m "feat: add E9 and C6 preset copedents"
```

---

## Task 5: Fret Position Utilities

**Files:**
- Create: `src/utils/fretUtils.ts`, `src/utils/fretUtils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/fretUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getFretX, getStringY, getStringThickness, FRET_MARKER_FRETS } from './fretUtils'

describe('getFretX', () => {
  it('returns 0 for fret 0 (nut)', () => {
    expect(getFretX(0, 1000)).toBe(0)
  })

  it('returns positions that decrease in spacing as fret number increases', () => {
    const spacing1 = getFretX(2, 1000) - getFretX(1, 1000)
    const spacing2 = getFretX(3, 1000) - getFretX(2, 1000)
    expect(spacing2).toBeLessThan(spacing1)
  })

  it('returns scaled positions relative to total width', () => {
    const pos500 = getFretX(5, 500)
    const pos1000 = getFretX(5, 1000)
    expect(pos1000).toBeCloseTo(pos500 * 2, 0)
  })
})

describe('getStringY', () => {
  it('returns evenly spaced positions', () => {
    const y1 = getStringY(0, 10, 200)
    const y2 = getStringY(1, 10, 200)
    const y3 = getStringY(2, 10, 200)
    expect(y2 - y1).toBeCloseTo(y3 - y2)
  })

  it('centers a single string', () => {
    const y = getStringY(0, 1, 200)
    expect(y).toBe(100)
  })
})

describe('getStringThickness', () => {
  it('thinner for higher strings (lower index)', () => {
    expect(getStringThickness(0, 10)).toBeLessThan(getStringThickness(9, 10))
  })
})

describe('FRET_MARKER_FRETS', () => {
  it('includes standard marker frets', () => {
    expect(FRET_MARKER_FRETS).toEqual(
      expect.arrayContaining([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/fretUtils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement fret utilities**

Create `src/utils/fretUtils.ts`:

```typescript
export const TOTAL_FRETS = 24

export const FRET_MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
export const DOUBLE_DOT_FRETS = new Set([12, 24])

/**
 * Calculate fret X position using real scale-length formula.
 * Position = scaleLength * (1 - 1 / 2^(fret/12))
 * Normalized to fit within totalWidth.
 */
export function getFretX(fret: number, totalWidth: number): number {
  if (fret === 0) return 0
  const maxPos = 1 - 1 / Math.pow(2, TOTAL_FRETS / 12)
  const pos = 1 - 1 / Math.pow(2, fret / 12)
  return (pos / maxPos) * totalWidth
}

/**
 * Calculate Y position for a string (0-indexed).
 * String 0 is at the top (highest pitch), last string at the bottom (lowest pitch).
 */
export function getStringY(
  stringIndex: number,
  totalStrings: number,
  fretboardHeight: number,
  paddingY: number = 20,
): number {
  if (totalStrings <= 1) return fretboardHeight / 2
  const usableHeight = fretboardHeight - paddingY * 2
  const spacing = usableHeight / (totalStrings - 1)
  return paddingY + stringIndex * spacing
}

/**
 * String thickness — thicker for lower-pitched strings (higher index).
 */
export function getStringThickness(stringIndex: number, totalStrings: number): number {
  if (totalStrings <= 1) return 2
  const min = 1
  const max = 3
  return min + (stringIndex / (totalStrings - 1)) * (max - min)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/fretUtils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/fretUtils.ts src/utils/fretUtils.test.ts
git commit -m "feat: add fret position and string thickness utilities"
```

---

## Task 6: localStorage Storage Utilities

**Files:**
- Create: `src/utils/storage.ts`, `src/utils/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { loadCopedents, saveCopedents, STORAGE_KEY } from './storage'
import { E9_PRESET, C6_PRESET } from '../data/presets'
import type { Copedent } from '../types'

beforeEach(() => {
  localStorage.clear()
})

describe('loadCopedents', () => {
  it('returns presets when storage is empty', () => {
    const result = loadCopedents()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Emmons E9')
    expect(result[1].name).toBe('Emmons C6')
  })

  it('returns saved copedents when storage has data', () => {
    const custom: Copedent = {
      id: 'custom-1', name: 'My Custom', pedals: ['A'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([custom]))
    const result = loadCopedents()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('My Custom')
  })

  it('returns presets when storage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const result = loadCopedents()
    expect(result).toHaveLength(2)
  })
})

describe('saveCopedents', () => {
  it('persists copedents to localStorage', () => {
    saveCopedents([E9_PRESET])
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Emmons E9')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement storage**

Create `src/utils/storage.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/storage.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.ts src/utils/storage.test.ts
git commit -m "feat: add localStorage persistence for copedents"
```

---

## Task 7: Fretboard SVG Component

**Files:**
- Create: `src/components/Fretboard/Fretboard.tsx`, `src/components/Fretboard/FretLines.tsx`, `src/components/Fretboard/StringLines.tsx`, `src/components/Fretboard/NoteIndicators.tsx`, `src/components/Fretboard/FretMarkers.tsx`, `src/components/Fretboard/Fretboard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/Fretboard/Fretboard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Fretboard } from './Fretboard'
import { E9_PRESET } from '../../data/presets'

const defaultProps = {
  copedent: E9_PRESET,
  engagedControls: new Set<string>(),
  displayMode: 'letters' as const,
  selectedKey: 'C',
}

describe('Fretboard', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders string number labels', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    // String labels are in the SVG — query by the string-labels group
    const textEls = container.querySelectorAll('svg text')
    const texts = Array.from(textEls).map(el => el.textContent)
    expect(texts).toContain('1')
    expect(texts).toContain('10')
  })

  it('renders fret number labels', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const textEls = container.querySelectorAll('svg text')
    const texts = Array.from(textEls).map(el => el.textContent)
    expect(texts).toContain('12')
  })

  it('renders note indicators as circles', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    // note-indicators group contains circles for each string x fret
    const noteGroup = container.querySelector('.note-indicators')
    const circles = noteGroup?.querySelectorAll('circle') ?? []
    // 10 strings x 25 frets (0-24) = 250 circles
    expect(circles.length).toBe(250)
  })

  it('highlights changed notes when controls are engaged', () => {
    const { container } = render(
      <Fretboard {...defaultProps} engagedControls={new Set(['A'])} />
    )
    const highlighted = container.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted.length).toBeGreaterThan(0)
  })

  it('shows no highlights when no controls are engaged', () => {
    const { container } = render(<Fretboard {...defaultProps} />)
    const highlighted = container.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted.length).toBe(0)
  })

  it('shows scale degrees when displayMode is scaleDegrees', () => {
    const { container } = render(
      <Fretboard {...defaultProps} displayMode="scaleDegrees" selectedKey="E" />
    )
    // Note indicators should show scale degree labels like "1", "b3", "5"
    const noteGroup = container.querySelector('.note-indicators')
    const texts = Array.from(noteGroup?.querySelectorAll('text') ?? []).map(el => el.textContent)
    // With key=E, every E note should show "1"
    expect(texts.filter(t => t === '1').length).toBeGreaterThan(0)
    // Should also contain other scale degrees
    expect(texts.filter(t => t === '5').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/Fretboard/Fretboard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement FretLines**

Create `src/components/Fretboard/FretLines.tsx`:

```tsx
import { getFretX, TOTAL_FRETS } from '../../utils/fretUtils'

interface FretLinesProps {
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function FretLines({ fretboardWidth, fretboardHeight, leftMargin }: FretLinesProps) {
  const lines = []
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const x = leftMargin + getFretX(fret, fretboardWidth)
    lines.push(
      <line
        key={fret}
        x1={x} y1={0} x2={x} y2={fretboardHeight}
        stroke={fret === 0 ? '#e5e7eb' : '#4b5563'}
        strokeWidth={fret === 0 ? 4 : 1}
      />
    )
  }
  return <g className="fret-lines">{lines}</g>
}
```

- [ ] **Step 4: Implement StringLines**

Create `src/components/Fretboard/StringLines.tsx`:

```tsx
import { getStringY, getStringThickness } from '../../utils/fretUtils'

interface StringLinesProps {
  totalStrings: number;
  fretboardHeight: number;
  totalWidth: number;
}

export function StringLines({ totalStrings, fretboardHeight, totalWidth }: StringLinesProps) {
  const lines = []
  for (let i = 0; i < totalStrings; i++) {
    const y = getStringY(i, totalStrings, fretboardHeight)
    lines.push(
      <line
        key={i}
        x1={0} y1={y} x2={totalWidth} y2={y}
        stroke="#9ca3af"
        strokeWidth={getStringThickness(i, totalStrings)}
      />
    )
  }
  return <g className="string-lines">{lines}</g>
}
```

- [ ] **Step 5: Implement FretMarkers**

Create `src/components/Fretboard/FretMarkers.tsx`:

```tsx
import { getFretX, FRET_MARKER_FRETS, DOUBLE_DOT_FRETS } from '../../utils/fretUtils'

interface FretMarkersProps {
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function FretMarkers({ fretboardWidth, fretboardHeight, leftMargin }: FretMarkersProps) {
  const markers: JSX.Element[] = []
  const midY = fretboardHeight / 2

  FRET_MARKER_FRETS.forEach(fret => {
    const prevX = leftMargin + getFretX(fret - 1, fretboardWidth)
    const currX = leftMargin + getFretX(fret, fretboardWidth)
    const centerX = (prevX + currX) / 2

    if (DOUBLE_DOT_FRETS.has(fret)) {
      markers.push(
        <circle key={`${fret}-a`} cx={centerX} cy={midY - 15} r={4} fill="#4b5563" />,
        <circle key={`${fret}-b`} cx={centerX} cy={midY + 15} r={4} fill="#4b5563" />,
      )
    } else {
      markers.push(
        <circle key={fret} cx={centerX} cy={midY} r={4} fill="#4b5563" />
      )
    }
  })

  return <g className="fret-markers">{markers}</g>
}
```

- [ ] **Step 6: Implement NoteIndicators**

Create `src/components/Fretboard/NoteIndicators.tsx`:

```tsx
import type { StringConfig, NoteDisplayMode } from '../../types'
import { calculateFretNote, getScaleDegree, noteToMidi, midiToNoteName } from '../../utils/noteUtils'
import { getFretX, getStringY, TOTAL_FRETS } from '../../utils/fretUtils'

interface NoteIndicatorsProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function NoteIndicators({
  strings, engagedControls, displayMode, selectedKey,
  fretboardWidth, fretboardHeight, leftMargin,
}: NoteIndicatorsProps) {
  const indicators: JSX.Element[] = []
  const radius = 11
  const fontSize = 9

  strings.forEach((s, si) => {
    const y = getStringY(si, strings.length, fretboardHeight)
    const openNoteName = midiToNoteName(noteToMidi(s.openNote))

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const activeNote = calculateFretNote(s.openNote, fret, s.changes, engagedControls)
      const openFretNote = calculateFretNote(s.openNote, fret, s.changes, new Set())
      const isHighlighted = activeNote !== openFretNote

      let x: number
      if (fret === 0) {
        x = leftMargin - 2
      } else {
        const prevFretX = leftMargin + getFretX(fret - 1, fretboardWidth)
        const currFretX = leftMargin + getFretX(fret, fretboardWidth)
        x = (prevFretX + currFretX) / 2
      }

      const displayText = displayMode === 'scaleDegrees'
        ? getScaleDegree(activeNote, selectedKey)
        : activeNote

      indicators.push(
        <g key={`${si}-${fret}`} data-highlighted={isHighlighted ? 'true' : 'false'}>
          <circle
            cx={x} cy={y} r={radius}
            fill={isHighlighted ? '#e63946' : '#1f2937'}
            stroke={isHighlighted ? '#e63946' : '#4b5563'}
            strokeWidth={1}
          />
          <text
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={fontSize}
            fontFamily="monospace"
          >
            {displayText}
          </text>
        </g>
      )
    }
  })

  return <g className="note-indicators">{indicators}</g>
}
```

- [ ] **Step 7: Implement Fretboard container**

Create `src/components/Fretboard/Fretboard.tsx`:

```tsx
import { useRef, useState, useEffect } from 'react'
import type { Copedent, NoteDisplayMode } from '../../types'
import { TOTAL_FRETS } from '../../utils/fretUtils'
import { getFretX } from '../../utils/fretUtils'
import { FretLines } from './FretLines'
import { StringLines } from './StringLines'
import { NoteIndicators } from './NoteIndicators'
import { FretMarkers } from './FretMarkers'

interface FretboardProps {
  copedent: Copedent;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
}

const LEFT_MARGIN = 50
const TOP_LABEL_HEIGHT = 20
const BOTTOM_LABEL_HEIGHT = 20
const STRING_LABEL_WIDTH = 30
const FRETBOARD_HEIGHT = 300
const MIN_FRET_WIDTH = 28

export function Fretboard({ copedent, engagedControls, displayMode, selectedKey }: FretboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const fretboardWidth = Math.max(containerWidth - LEFT_MARGIN - STRING_LABEL_WIDTH, (TOTAL_FRETS + 1) * MIN_FRET_WIDTH)
  const totalSvgWidth = LEFT_MARGIN + fretboardWidth + 10
  const totalSvgHeight = TOP_LABEL_HEIGHT + FRETBOARD_HEIGHT + BOTTOM_LABEL_HEIGHT

  // Fret number labels
  const fretLabels: JSX.Element[] = []
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    let x: number
    if (fret === 0) {
      x = LEFT_MARGIN - 2
    } else {
      const prevX = LEFT_MARGIN + getFretX(fret - 1, fretboardWidth)
      const currX = LEFT_MARGIN + getFretX(fret, fretboardWidth)
      x = (prevX + currX) / 2
    }
    fretLabels.push(
      <text
        key={fret}
        x={x}
        y={TOP_LABEL_HEIGHT - 4}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={10}
        fontFamily="monospace"
      >
        {fret}
      </text>
    )
  }

  // String number labels
  const stringLabels = copedent.strings.map((s, i) => {
    const y = TOP_LABEL_HEIGHT + (FRETBOARD_HEIGHT / (copedent.strings.length - 1)) * i
    // Adjust for padding in getStringY
    const paddingY = 20
    const usableHeight = FRETBOARD_HEIGHT - paddingY * 2
    const spacing = usableHeight / (copedent.strings.length - 1)
    const sy = TOP_LABEL_HEIGHT + paddingY + i * spacing
    return (
      <text
        key={i}
        x={10}
        y={sy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#9ca3af"
        fontSize={11}
        fontFamily="monospace"
      >
        {s.number}
      </text>
    )
  })

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        width={totalSvgWidth}
        height={totalSvgHeight}
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
      >
        {/* Fret numbers */}
        <g>{fretLabels}</g>

        {/* String numbers */}
        <g>{stringLabels}</g>

        {/* Fretboard area (offset by top label height) */}
        <g transform={`translate(0, ${TOP_LABEL_HEIGHT})`}>
          <FretMarkers
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
          />
          <FretLines
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
          />
          <StringLines
            totalStrings={copedent.strings.length}
            fretboardHeight={FRETBOARD_HEIGHT}
            totalWidth={totalSvgWidth}
          />
          <NoteIndicators
            strings={copedent.strings}
            engagedControls={engagedControls}
            displayMode={displayMode}
            selectedKey={selectedKey}
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
          />
        </g>
      </svg>
    </div>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run src/components/Fretboard/Fretboard.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/Fretboard/
git commit -m "feat: add SVG fretboard with note indicators, fret lines, and markers"
```

---

## Task 8: Control Panel

**Files:**
- Create: `src/components/ControlPanel/ToggleButton.tsx`, `src/components/ControlPanel/DisplayOptions.tsx`, `src/components/ControlPanel/ControlPanel.tsx`, `src/components/ControlPanel/ControlPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ControlPanel/ControlPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlPanel } from './ControlPanel'

const defaultProps = {
  pedals: ['A', 'B', 'C'],
  kneeLevers: ['LKL', 'LKR', 'RKL'],
  engagedControls: new Set<string>(),
  onToggleControl: vi.fn(),
  onClearAll: vi.fn(),
  displayMode: 'letters' as const,
  selectedKey: 'C',
  onDisplayModeChange: vi.fn(),
  onSelectedKeyChange: vi.fn(),
}

describe('ControlPanel', () => {
  it('renders all pedal buttons', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'A' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'B' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'C' })).toBeTruthy()
  })

  it('renders all knee lever buttons', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'LKL' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'LKR' })).toBeTruthy()
  })

  it('calls onToggleControl when a pedal is clicked', async () => {
    const onToggle = vi.fn()
    render(<ControlPanel {...defaultProps} onToggleControl={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onToggle).toHaveBeenCalledWith('A')
  })

  it('shows engaged controls as visually distinct', () => {
    render(
      <ControlPanel {...defaultProps} engagedControls={new Set(['A'])} />
    )
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.dataset.engaged).toBe('true')
  })

  it('renders clear all button', () => {
    render(<ControlPanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeTruthy()
  })

  it('calls onClearAll when clear all is clicked', async () => {
    const onClear = vi.fn()
    render(<ControlPanel {...defaultProps} onClearAll={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(onClear).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/ControlPanel/ControlPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ToggleButton**

Create `src/components/ControlPanel/ToggleButton.tsx`:

```tsx
interface ToggleButtonProps {
  label: string;
  engaged: boolean;
  onClick: () => void;
}

export function ToggleButton({ label, engaged, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      data-engaged={engaged ? 'true' : 'false'}
      className={`
        px-4 py-2 rounded font-mono text-sm font-bold transition-colors
        ${engaged
          ? 'bg-red-600 text-white border-2 border-red-400'
          : 'bg-gray-800 text-gray-300 border-2 border-gray-600 hover:border-gray-400'
        }
      `}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 4: Implement DisplayOptions**

Create `src/components/ControlPanel/DisplayOptions.tsx`:

```tsx
import type { NoteDisplayMode } from '../../types'
import { NOTE_NAMES } from '../../utils/noteUtils'

interface DisplayOptionsProps {
  displayMode: NoteDisplayMode;
  selectedKey: string;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  onSelectedKeyChange: (key: string) => void;
}

export function DisplayOptions({
  displayMode, selectedKey, onDisplayModeChange, onSelectedKeyChange,
}: DisplayOptionsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Display:</span>
        <button
          onClick={() => onDisplayModeChange('letters')}
          className={`px-3 py-1 text-sm rounded ${
            displayMode === 'letters'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Letters
        </button>
        <button
          onClick={() => onDisplayModeChange('scaleDegrees')}
          className={`px-3 py-1 text-sm rounded ${
            displayMode === 'scaleDegrees'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Scale Degrees
        </button>
      </div>

      {displayMode === 'scaleDegrees' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Key:</span>
          <select
            value={selectedKey}
            onChange={e => onSelectedKeyChange(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {NOTE_NAMES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement ControlPanel**

Create `src/components/ControlPanel/ControlPanel.tsx`:

```tsx
import type { NoteDisplayMode } from '../../types'
import { ToggleButton } from './ToggleButton'
import { DisplayOptions } from './DisplayOptions'

interface ControlPanelProps {
  pedals: string[];
  kneeLevers: string[];
  engagedControls: Set<string>;
  onToggleControl: (control: string) => void;
  onClearAll: () => void;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  onSelectedKeyChange: (key: string) => void;
}

export function ControlPanel({
  pedals, kneeLevers, engagedControls, onToggleControl, onClearAll,
  displayMode, selectedKey, onDisplayModeChange, onSelectedKeyChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Pedals */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pedals</h3>
        <div className="flex flex-wrap gap-2">
          {pedals.map(p => (
            <ToggleButton
              key={p}
              label={p}
              engaged={engagedControls.has(p)}
              onClick={() => onToggleControl(p)}
            />
          ))}
        </div>
      </div>

      {/* Knee Levers */}
      {kneeLevers.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Knee Levers</h3>
          <div className="flex flex-wrap gap-2">
            {kneeLevers.map(l => (
              <ToggleButton
                key={l}
                label={l}
                engaged={engagedControls.has(l)}
                onClick={() => onToggleControl(l)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clear All + Display Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800">
        <button
          onClick={onClearAll}
          className="px-3 py-1 text-sm bg-gray-800 text-gray-400 rounded hover:text-white hover:bg-gray-700 transition-colors"
        >
          Clear All
        </button>
        <DisplayOptions
          displayMode={displayMode}
          selectedKey={selectedKey}
          onDisplayModeChange={onDisplayModeChange}
          onSelectedKeyChange={onSelectedKeyChange}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/components/ControlPanel/ControlPanel.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ControlPanel/
git commit -m "feat: add control panel with pedal/lever toggles and display options"
```

---

## Task 9: App Shell & State Management

**Files:**
- Create: `src/hooks/useCopedentState.ts`, `src/hooks/useCopedentState.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for state hook**

Create `src/hooks/useCopedentState.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopedentState } from './useCopedentState'

beforeEach(() => {
  localStorage.clear()
})

describe('useCopedentState', () => {
  it('initializes with presets', () => {
    const { result } = renderHook(() => useCopedentState())
    expect(result.current.copedents).toHaveLength(2)
    expect(result.current.activeCopedent.name).toBe('Emmons E9')
  })

  it('toggles controls on and off', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.toggleControl('A'))
    expect(result.current.engagedControls.has('A')).toBe(true)
    act(() => result.current.toggleControl('A'))
    expect(result.current.engagedControls.has('A')).toBe(false)
  })

  it('clears all controls', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => {
      result.current.toggleControl('A')
      result.current.toggleControl('B')
    })
    act(() => result.current.clearAllControls())
    expect(result.current.engagedControls.size).toBe(0)
  })

  it('switches active copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const c6Id = result.current.copedents[1].id
    act(() => result.current.setActiveCopedentId(c6Id))
    expect(result.current.activeCopedent.name).toBe('Emmons C6')
  })

  it('clears engaged controls when switching copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.toggleControl('A'))
    const c6Id = result.current.copedents[1].id
    act(() => result.current.setActiveCopedentId(c6Id))
    expect(result.current.engagedControls.size).toBe(0)
  })

  it('changes display mode', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.setDisplayMode('scaleDegrees'))
    expect(result.current.displayMode).toBe('scaleDegrees')
  })

  it('duplicates a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.duplicateCopedent(result.current.copedents[0].id))
    expect(result.current.copedents).toHaveLength(3)
    expect(result.current.copedents[2].name).toContain('Copy')
  })

  it('deletes a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const e9Id = result.current.copedents[0].id
    act(() => result.current.deleteCopedent(e9Id))
    expect(result.current.copedents).toHaveLength(1)
  })

  it('does not delete last copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    act(() => result.current.deleteCopedent(result.current.copedents[0].id))
    act(() => result.current.deleteCopedent(result.current.copedents[0].id))
    expect(result.current.copedents).toHaveLength(1)
  })

  it('updates a copedent', () => {
    const { result } = renderHook(() => useCopedentState())
    const id = result.current.copedents[0].id
    act(() => result.current.updateCopedent(id, { name: 'My E9' }))
    expect(result.current.copedents[0].name).toBe('My E9')
  })

  it('creates a new copedent and switches to it', () => {
    const { result } = renderHook(() => useCopedentState())
    const newCop = {
      id: 'new-1', name: 'Custom', pedals: ['X'], kneeLevers: [],
      strings: [{ number: 1, openNote: 'E4', changes: [] }],
    }
    act(() => result.current.createCopedent(newCop))
    expect(result.current.copedents).toHaveLength(3)
    expect(result.current.activeCopedent.name).toBe('Custom')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/useCopedentState.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement state hook**

Create `src/hooks/useCopedentState.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react'
import type { Copedent, NoteDisplayMode } from '../types'
import { loadCopedents, saveCopedents } from '../utils/storage'

export function useCopedentState() {
  const [copedents, setCopedents] = useState<Copedent[]>(() => loadCopedents())
  const [activeCopedentId, setActiveCopedentId] = useState<string>(() => copedents[0].id)
  const [engagedControls, setEngagedControls] = useState<Set<string>>(new Set())
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>('letters')
  const [selectedKey, setSelectedKey] = useState('C')

  // Persist on change
  useEffect(() => {
    saveCopedents(copedents)
  }, [copedents])

  const activeCopedent = copedents.find(c => c.id === activeCopedentId) ?? copedents[0]

  const switchCopedent = useCallback((id: string) => {
    setActiveCopedentId(id)
    setEngagedControls(new Set())
  }, [])

  const toggleControl = useCallback((control: string) => {
    setEngagedControls(prev => {
      const next = new Set(prev)
      if (next.has(control)) next.delete(control)
      else next.add(control)
      return next
    })
  }, [])

  const clearAllControls = useCallback(() => {
    setEngagedControls(new Set())
  }, [])

  const updateCopedent = useCallback((id: string, updates: Partial<Copedent>) => {
    setCopedents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const duplicateCopedent = useCallback((id: string) => {
    setCopedents(prev => {
      const source = prev.find(c => c.id === id)
      if (!source) return prev
      const copy: Copedent = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
        name: `${source.name} (Copy)`,
      }
      return [...prev, copy]
    })
  }, [])

  const deleteCopedent = useCallback((id: string) => {
    setCopedents(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(c => c.id !== id)
      if (activeCopedentId === id) {
        setActiveCopedentId(next[0].id)
        setEngagedControls(new Set())
      }
      return next
    })
  }, [activeCopedentId])

  const createCopedent = useCallback((copedent: Copedent) => {
    setCopedents(prev => [...prev, copedent])
    setActiveCopedentId(copedent.id)
    setEngagedControls(new Set())
  }, [])

  return {
    copedents,
    activeCopedent,
    activeCopedentId,
    engagedControls,
    displayMode,
    selectedKey,
    setActiveCopedentId: switchCopedent,
    toggleControl,
    clearAllControls,
    setDisplayMode,
    setSelectedKey,
    updateCopedent,
    duplicateCopedent,
    deleteCopedent,
    createCopedent,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/useCopedentState.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Wire up App.tsx**

Replace `src/App.tsx`:

```tsx
import { Fretboard } from './components/Fretboard/Fretboard'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { useCopedentState } from './hooks/useCopedentState'

function App() {
  const state = useCopedentState()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Pedal Steel Visualizer</h1>
          <div className="flex items-center gap-2">
            <select
              value={state.activeCopedentId}
              onChange={e => state.setActiveCopedentId(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm"
            >
              {state.copedents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Fretboard
          copedent={state.activeCopedent}
          engagedControls={state.engagedControls}
          displayMode={state.displayMode}
          selectedKey={state.selectedKey}
        />

        <ControlPanel
          pedals={state.activeCopedent.pedals}
          kneeLevers={state.activeCopedent.kneeLevers}
          engagedControls={state.engagedControls}
          onToggleControl={state.toggleControl}
          onClearAll={state.clearAllControls}
          displayMode={state.displayMode}
          selectedKey={state.selectedKey}
          onDisplayModeChange={state.setDisplayMode}
          onSelectedKeyChange={state.setSelectedKey}
        />
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 7: Manual smoke test**

```bash
npm run dev
```

Verify: Fretboard renders with E9 preset, pedal toggles work, notes update in real time, scale degree mode works, copedent switcher works.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/ src/App.tsx
git commit -m "feat: wire app shell with state management, fretboard, and control panel"
```

---

## Task 10: Copedent Manager

**Files:**
- Create: `src/components/CopedentManager/CopedentManager.tsx`, `src/components/CopedentManager/CopedentManager.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/CopedentManager/CopedentManager.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopedentManager } from './CopedentManager'
import { E9_PRESET, C6_PRESET } from '../../data/presets'

const defaultProps = {
  copedents: [E9_PRESET, C6_PRESET],
  activeCopedentId: E9_PRESET.id,
  onSelect: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onCreateNew: vi.fn(),
  onOpenEditor: vi.fn(),
}

describe('CopedentManager', () => {
  it('renders copedent selector with all copedents', () => {
    render(<CopedentManager {...defaultProps} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeTruthy()
  })

  it('renders action buttons', () => {
    render(<CopedentManager {...defaultProps} />)
    expect(screen.getByRole('button', { name: /new/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /edit/i })).toBeTruthy()
  })

  it('calls onDuplicate with active copedent id', async () => {
    const onDup = vi.fn()
    render(<CopedentManager {...defaultProps} onDuplicate={onDup} />)
    await userEvent.click(screen.getByRole('button', { name: /duplicate/i }))
    expect(onDup).toHaveBeenCalledWith(E9_PRESET.id)
  })

  it('calls onDelete with active copedent id', async () => {
    const onDel = vi.fn()
    render(<CopedentManager {...defaultProps} onDelete={onDel} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDel).toHaveBeenCalledWith(E9_PRESET.id)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/CopedentManager/CopedentManager.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement CopedentManager**

Create `src/components/CopedentManager/CopedentManager.tsx`:

```tsx
import type { Copedent } from '../../types'

interface CopedentManagerProps {
  copedents: Copedent[];
  activeCopedentId: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onOpenEditor: () => void;
}

export function CopedentManager({
  copedents, activeCopedentId, onSelect, onDuplicate, onDelete, onCreateNew, onOpenEditor,
}: CopedentManagerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activeCopedentId}
        onChange={e => onSelect(e.target.value)}
        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm"
      >
        {copedents.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button
        onClick={onCreateNew}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        New
      </button>
      <button
        onClick={() => onDuplicate(activeCopedentId)}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        Duplicate
      </button>
      <button
        onClick={onOpenEditor}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(activeCopedentId)}
        className="px-3 py-1.5 text-sm bg-red-900 text-red-300 border border-red-700 rounded hover:bg-red-800"
      >
        Delete
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/CopedentManager/CopedentManager.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Integrate CopedentManager into App.tsx header**

Replace the inline `<select>` in `App.tsx` header with the `CopedentManager` component. Add `editorOpen` state and pass `onOpenEditor` / `onCreateNew` handlers. The editor panel (Task 11) will be conditionally rendered based on this state.

```tsx
// Add to imports:
import { CopedentManager } from './components/CopedentManager/CopedentManager'
import { useState } from 'react'

// Inside App():
const [editorOpen, setEditorOpen] = useState(false)

const handleCreateNew = () => {
  const newCopedent: Copedent = {
    id: crypto.randomUUID(),
    name: 'New Copedent',
    pedals: ['A', 'B', 'C'],
    kneeLevers: ['LKL', 'LKR'],
    strings: Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      openNote: 'E3',
      changes: [],
    })),
  }
  state.createCopedent(newCopedent)
  setEditorOpen(true)
}

// Replace the header select with:
<CopedentManager
  copedents={state.copedents}
  activeCopedentId={state.activeCopedentId}
  onSelect={state.setActiveCopedentId}
  onDuplicate={state.duplicateCopedent}
  onDelete={state.deleteCopedent}
  onCreateNew={handleCreateNew}
  onOpenEditor={() => setEditorOpen(!editorOpen)}
/>
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/CopedentManager/ src/App.tsx
git commit -m "feat: add copedent manager with create, duplicate, delete"
```

---

## Task 11: Copedent Editor

**Files:**
- Create: `src/components/CopedentEditor/CopedentEditor.tsx`, `src/components/CopedentEditor/GuitarConfig.tsx`, `src/components/CopedentEditor/StringSetup.tsx`, `src/components/CopedentEditor/ChangesMatrix.tsx`, `src/components/CopedentEditor/ImportExport.tsx`, `src/components/CopedentEditor/CopedentEditor.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/CopedentEditor/CopedentEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopedentEditor } from './CopedentEditor'
import { E9_PRESET } from '../../data/presets'

const defaultProps = {
  copedent: E9_PRESET,
  onUpdate: vi.fn(),
  onClose: vi.fn(),
}

describe('CopedentEditor', () => {
  it('renders copedent name input', () => {
    render(<CopedentEditor {...defaultProps} />)
    const input = screen.getByDisplayValue('Emmons E9')
    expect(input).toBeTruthy()
  })

  it('renders string open note inputs', () => {
    render(<CopedentEditor {...defaultProps} />)
    // E9 has F#4 as first string
    expect(screen.getByDisplayValue('F#4')).toBeTruthy()
  })

  it('renders changes matrix', () => {
    render(<CopedentEditor {...defaultProps} />)
    // Should show pedal headers
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
  })

  it('calls onUpdate when name changes', async () => {
    const onUpdate = vi.fn()
    render(<CopedentEditor {...defaultProps} onUpdate={onUpdate} />)
    const input = screen.getByDisplayValue('Emmons E9')
    await userEvent.clear(input)
    await userEvent.type(input, 'My E9')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('renders close button', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeTruthy()
  })

  it('renders import/export section', () => {
    render(<CopedentEditor {...defaultProps} />)
    expect(screen.getByRole('button', { name: /export/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /import/i })).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/CopedentEditor/CopedentEditor.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement GuitarConfig**

Create `src/components/CopedentEditor/GuitarConfig.tsx`:

```tsx
import type { Copedent } from '../../types'

interface GuitarConfigProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function GuitarConfig({ copedent, onUpdate }: GuitarConfigProps) {
  const updateName = (name: string) => onUpdate({ name })

  const addPedal = () => {
    const next = String.fromCharCode(65 + copedent.pedals.length) // A, B, C...
    onUpdate({ pedals: [...copedent.pedals, next] })
  }

  const removePedal = (index: number) => {
    const removed = copedent.pedals[index]
    onUpdate({
      pedals: copedent.pedals.filter((_, i) => i !== index),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.filter(c => c.control !== removed),
      })),
    })
  }

  const renamePedal = (index: number, newName: string) => {
    const oldName = copedent.pedals[index]
    onUpdate({
      pedals: copedent.pedals.map((p, i) => i === index ? newName : p),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.map(c => c.control === oldName ? { ...c, control: newName } : c),
      })),
    })
  }

  const addLever = () => {
    const levers = ['LKL', 'LKR', 'RKL', 'RKR', 'RKR2']
    const next = levers[copedent.kneeLevers.length] ?? `KL${copedent.kneeLevers.length + 1}`
    onUpdate({ kneeLevers: [...copedent.kneeLevers, next] })
  }

  const removeLever = (index: number) => {
    const removed = copedent.kneeLevers[index]
    onUpdate({
      kneeLevers: copedent.kneeLevers.filter((_, i) => i !== index),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.filter(c => c.control !== removed),
      })),
    })
  }

  const renameLever = (index: number, newName: string) => {
    const oldName = copedent.kneeLevers[index]
    onUpdate({
      kneeLevers: copedent.kneeLevers.map((l, i) => i === index ? newName : l),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.map(c => c.control === oldName ? { ...c, control: newName } : c),
      })),
    })
  }

  const setStringCount = (count: number) => {
    const clamped = Math.max(1, Math.min(14, count))
    if (clamped === copedent.strings.length) return
    if (clamped > copedent.strings.length) {
      const newStrings = Array.from(
        { length: clamped - copedent.strings.length },
        (_, i) => ({
          number: copedent.strings.length + i + 1,
          openNote: 'E3',
          changes: [],
        })
      )
      onUpdate({ strings: [...copedent.strings, ...newStrings] })
    } else {
      onUpdate({ strings: copedent.strings.slice(0, clamped) })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <input
          value={copedent.name}
          onChange={e => updateName(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 w-full"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Strings ({copedent.strings.length})</label>
        <input
          type="number" min={1} max={14}
          value={copedent.strings.length}
          onChange={e => setStringCount(parseInt(e.target.value, 10))}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 w-20"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Pedals</label>
          <button onClick={addPedal} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {copedent.pedals.map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={p}
                onChange={e => renamePedal(i, e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm"
              />
              <button onClick={() => removePedal(i)} className="text-red-500 text-xs hover:text-red-400">x</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Knee Levers</label>
          <button onClick={addLever} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {copedent.kneeLevers.map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={l}
                onChange={e => renameLever(i, e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm"
              />
              <button onClick={() => removeLever(i)} className="text-red-500 text-xs hover:text-red-400">x</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement StringSetup**

Create `src/components/CopedentEditor/StringSetup.tsx`:

```tsx
import type { Copedent, StringConfig } from '../../types'
import { normalizeNoteName, parseNote } from '../../utils/noteUtils'

interface StringSetupProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function StringSetup({ copedent, onUpdate }: StringSetupProps) {
  const updateStringNote = (index: number, noteStr: string) => {
    // Normalize flats to sharps on the stored value
    let normalized = noteStr
    try {
      const parsed = parseNote(noteStr)
      normalized = normalizeNoteName(parsed.name) + parsed.octave
    } catch {
      // Let user keep typing — store raw until valid
      normalized = noteStr
    }

    const newStrings = copedent.strings.map((s, i) =>
      i === index ? { ...s, openNote: normalized } : s
    )
    onUpdate({ strings: newStrings })
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">Open Notes</label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {copedent.strings.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-4 text-right">{s.number}</span>
            <input
              value={s.openNote}
              onChange={e => updateStringNote(i, e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement ChangesMatrix**

Create `src/components/CopedentEditor/ChangesMatrix.tsx`:

```tsx
import type { Copedent, StringChange } from '../../types'

interface ChangesMatrixProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function ChangesMatrix({ copedent, onUpdate }: ChangesMatrixProps) {
  const allControls = [...copedent.pedals, ...copedent.kneeLevers]

  const getChange = (stringIndex: number, control: string): number | null => {
    const change = copedent.strings[stringIndex].changes.find(c => c.control === control)
    return change ? change.semitones : null
  }

  const setChange = (stringIndex: number, control: string, value: string) => {
    const parsed = parseInt(value, 10)
    const newStrings = copedent.strings.map((s, si) => {
      if (si !== stringIndex) return s
      const filtered = s.changes.filter(c => c.control !== control)
      if (!isNaN(parsed) && parsed !== 0) {
        filtered.push({ control, semitones: parsed })
      }
      return { ...s, changes: filtered }
    })
    onUpdate({ strings: newStrings })
  }

  if (allControls.length === 0) {
    return <p className="text-sm text-gray-500">Add pedals or knee levers to define changes.</p>
  }

  return (
    <div className="overflow-x-auto">
      <label className="block text-sm text-gray-400 mb-2">Changes Matrix (semitones)</label>
      <table className="text-sm font-mono">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-gray-500">Str</th>
            {allControls.map(c => (
              <th key={c} className="px-2 py-1 text-center text-gray-400">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {copedent.strings.map((s, si) => (
            <tr key={si}>
              <td className="px-2 py-1 text-gray-500">{s.number}</td>
              {allControls.map(c => {
                const val = getChange(si, c)
                return (
                  <td key={c} className="px-1 py-1">
                    <input
                      type="number"
                      value={val ?? ''}
                      onChange={e => setChange(si, c, e.target.value)}
                      placeholder="—"
                      className="bg-gray-800 text-white border border-gray-700 rounded px-1 py-0.5 w-12 text-center text-sm"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Implement ImportExport**

Create `src/components/CopedentEditor/ImportExport.tsx`:

```tsx
import { useState } from 'react'
import type { Copedent } from '../../types'
import { validateCopedent } from '../../utils/validation'

interface ImportExportProps {
  copedent: Copedent;
  onImport: (copedent: Copedent) => void;
}

export function ImportExport({ copedent, onImport }: ImportExportProps) {
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [showImport, setShowImport] = useState(false)

  const handleExport = () => {
    navigator.clipboard.writeText(JSON.stringify(copedent, null, 2))
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText)
      const errors = validateCopedent(parsed)
      if (errors.length > 0) {
        setImportError(errors.map(e => e.message).join(', '))
        return
      }
      // Preserve the current copedent's ID so we replace in place
      onImport({ ...parsed, id: copedent.id })
      setImportText('')
      setImportError('')
      setShowImport(false)
    } catch {
      setImportError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
        >
          Export JSON
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
        >
          Import JSON
        </button>
      </div>
      {showImport && (
        <div className="space-y-2">
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste copedent JSON here..."
            className="w-full h-32 bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm font-mono"
          />
          {importError && <p className="text-red-400 text-sm">{importError}</p>}
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-sm bg-cyan-700 text-white rounded hover:bg-cyan-600"
          >
            Apply Import
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Implement CopedentEditor container**

Create `src/components/CopedentEditor/CopedentEditor.tsx`:

```tsx
import type { Copedent } from '../../types'
import { GuitarConfig } from './GuitarConfig'
import { StringSetup } from './StringSetup'
import { ChangesMatrix } from './ChangesMatrix'
import { ImportExport } from './ImportExport'

interface CopedentEditorProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
  onClose: () => void;
}

export function CopedentEditor({ copedent, onUpdate, onClose }: CopedentEditorProps) {
  const handleImport = (imported: Copedent) => {
    onUpdate(imported)
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Edit Copedent</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-gray-800 text-gray-400 rounded hover:text-white"
        >
          Close
        </button>
      </div>

      <GuitarConfig copedent={copedent} onUpdate={onUpdate} />
      <StringSetup copedent={copedent} onUpdate={onUpdate} />
      <ChangesMatrix copedent={copedent} onUpdate={onUpdate} />
      <ImportExport copedent={copedent} onImport={handleImport} />
    </div>
  )
}
```

- [ ] **Step 8: Integrate editor into App.tsx**

Add to `src/App.tsx` (between header and fretboard):

```tsx
// Add import:
import { CopedentEditor } from './components/CopedentEditor/CopedentEditor'

// In the main section, before Fretboard:
{editorOpen && (
  <CopedentEditor
    copedent={state.activeCopedent}
    onUpdate={(updates) => state.updateCopedent(state.activeCopedentId, updates)}
    onClose={() => setEditorOpen(false)}
  />
)}
```

- [ ] **Step 9: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 10: Manual smoke test**

```bash
npm run dev
```

Verify: Editor opens/closes, name changes, string notes editable, changes matrix works, import/export works, fretboard updates live as editor changes are made.

- [ ] **Step 11: Commit**

```bash
git add src/components/CopedentEditor/ src/App.tsx
git commit -m "feat: add copedent editor with guitar config, string setup, changes matrix, import/export"
```

---

## Task 12: Polish & Final Integration

**Files:**
- Modify: `src/App.tsx`, various components as needed

- [ ] **Step 1: Add keyboard shortcuts for controls**

In `src/App.tsx`, add a `useEffect` for keyboard listeners:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // Escape clears all controls
    if (e.key === 'Escape') {
      state.clearAllControls()
      return
    }
    // Number keys 1-9 toggle pedals by position
    const num = parseInt(e.key, 10)
    if (!isNaN(num) && num >= 1 && num <= state.activeCopedent.pedals.length) {
      // Only if not focused on an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      state.toggleControl(state.activeCopedent.pedals[num - 1])
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [state.activeCopedent.pedals, state.toggleControl, state.clearAllControls])
```

- [ ] **Step 2: Verify responsive behavior**

```bash
npm run dev
```

Resize browser window. Verify fretboard scrolls horizontally on narrow screens, controls wrap properly.

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Build for production**

```bash
npm run build
```

Expected: Clean build, no warnings.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add keyboard shortcuts and polish"
```

---

## Summary

| Task | Component | Tests | Est. Steps |
|------|-----------|-------|------------|
| 1 | Project scaffolding | — | 9 |
| 2 | Types & note utilities | 18 | 6 |
| 3 | Copedent validation | 9 | 5 |
| 4 | Preset copedents | 5 | 5 |
| 5 | Fret position utilities | 5 | 5 |
| 6 | localStorage storage | 4 | 5 |
| 7 | Fretboard SVG | 6 | 9 |
| 8 | Control Panel | 6 | 7 |
| 9 | App shell & state | 10 | 8 |
| 10 | Copedent Manager | 4 | 7 |
| 11 | Copedent Editor | 6 | 11 |
| 12 | Polish & integration | — | 6 |
| **Total** | | **73** | **83** |
