# Pedal Steel Visualizer — Design Spec

**Date:** 2026-03-24
**Status:** Approved
**Type:** Standalone project (Cowork-only)

---

## Overview

A browser-based tool that visualizes the notes available on a pedal steel guitar across the fretboard. Users define custom copedents (the tuning and pedal/lever configuration for a specific guitar), then interactively engage pedals and knee levers to see the fretboard update in real time.

**Target user:** Initially the author (Gabe); designed to support other pedal steel players down the road.

---

## Tech Stack

- **React 19** — component-based UI, state-driven rendering
- **Vite** — dev server and build tooling
- **Tailwind CSS** — utility-first styling
- **Vitest + Testing Library** — unit and component tests
- **SVG** — fretboard rendering (crisp, scalable, styleable)
- **localStorage** — copedent persistence (v1, no backend)
- **Static deploy** — Vercel, Netlify, or GitHub Pages

---

## Data Model

### Copedent

The copedent is the core data structure. It fully defines the instrument configuration.

```typescript
interface Copedent {
  id: string;                    // generated UUID — stable identity for storage
  name: string;                  // display name, does not need to be unique
  pedals: string[];              // e.g. ["A", "B", "C"]
  kneeLevers: string[];          // e.g. ["LKL", "LKR", "RKL", "RKR"]
  strings: StringConfig[];
}

interface StringConfig {
  number: number;                // string number (1-based)
  openNote: string;              // note + octave, e.g. "F#4"
  changes: StringChange[];
}

interface StringChange {
  control: string;               // references a pedal or knee lever name
  semitones: number;             // signed: +1 = raise half step, -2 = lower whole step
}
```

**Note representation:** Notes are stored in sharp notation only (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) followed by octave number (e.g. "F#4"). The editor accepts flat input (e.g. "Bb3") and normalizes to the sharp equivalent on save.

**Validation rules:**
- `semitones` must be non-zero (a zero change is meaningless — omit the entry instead)
- One entry per control per string (duplicates rejected)
- String count: 1–14
- Pedals: 0–12
- Knee levers: 0–12
- Open note range: C1–C7

**Key behaviors:**
- A single control (pedal or lever) can affect multiple strings — each string independently lists which controls affect it.
- When multiple controls are engaged simultaneously, effects are **additive per string**. Example: pedal A raises string 5 by +2, knee lever LKL lowers string 5 by -1 → net result is +1 when both are active.
- The number of strings, pedals, and knee levers is fully variable per copedent — defined by the copedent, not hardcoded.

### App State

At any moment, the full visualization is derived from three pieces of state:

1. **Active copedent** — the full Copedent object
2. **Engaged controls** — Set of currently active pedal/lever names
3. **Display mode** — note letters vs. scale degrees (+ selected key for scale degrees)

Note calculation: for each string, take the open note, sum the semitone changes for all engaged controls that affect that string, then calculate each fret position (result + fret number in semitones).

---

## Fretboard Visualization

**Layout:** Horizontal SVG rendering.
- **Nut** on the left (bold vertical line)
- **Frets** going right, with realistic spacing (narrower as fret number increases, proportional to scale length)
- **Strings** run horizontally; lower-pitched strings at the bottom (player's perspective looking down)
- **String thickness** varies — thicker for lower-pitched strings

**Note indicators:** Circles at each string x fret intersection displaying the current note.

**Note display modes** (user toggle):
1. **Letter names** — C, C#, D, D#, E, F, F#, G, G#, A, A#, B
2. **Scale degrees** — 1, b2, 2, b3, 3, 4, b5, 5, b6, 6, b7, 7 (relative to a user-selected key)

**Visual feedback for active controls:** A note is highlighted if its current pitch differs from the open (no controls engaged) pitch for that string/fret position. Net-zero changes (e.g. +1 and -1 from two controls) are NOT highlighted. Highlighted notes use a distinct background color; unhighlighted notes use the default style.

**Fret range:** 0 (open) through 24. All copedents render this full range.

**Fret markers:** Dots at frets 3, 5, 7, 9, 12 (double dot), 15, 17, 19, 21, 24.

**Responsive scaling:**
- Number of visible frets determined by available screen width — each note circle must remain legible
- On narrow screens, fewer frets shown with horizontal scroll for the rest
- Desktop-first, but works on smaller screens

**Labels:**
- String numbers at the nut (left side)
- Fret numbers along the top or bottom

---

## Control Panel

**Position:** Below the fretboard (mirrors physical pedal/lever placement).

**Two groups of toggle buttons:**
- **Pedals** — rendered from the copedent's `pedals` array
- **Knee Levers** — rendered from the copedent's `kneeLevers` array

**Toggle behavior:**
- Click to engage/disengage
- Active controls are visually distinct (filled/colored when on, outlined when off)
- Fretboard updates instantly on every toggle change
- "Clear all" button to disengage everything at once

**Display options** (separate toolbar area):
- Note mode toggle: Letters / Scale Degrees
- Key selector dropdown (only relevant in scale degree mode)

---

## Copedent Editor

### Form Builder

Single scrollable form with three sections (no wizard/stepper — simpler for v1):

1. **Guitar Config** — name the copedent, add/remove/rename pedals, add/remove/rename knee levers, set number of strings
2. **String Setup** — for each string, set the open note (note + octave via picker or text input; accepts flats, normalizes to sharps)
3. **Changes Matrix** — grid with strings as rows, controls (all pedals + all levers) as columns. Each cell is either empty (no effect) or a signed semitone value. Click a cell to set/edit.

### Import / Export

- **Import:** Paste a copedent as JSON (matching the data model schema)
- **Export:** Copy copedent as JSON
- Future: support additional text formats if a community standard exists

### Copedent Management

- All copedents stored under a single localStorage key (`psv-copedents`) as a JSON array. Each copedent is identified by its `id` (UUID), not its name.
- Switch between saved copedents via a selector
- Duplicate, rename, delete copedents
- **Presets included:** Standard Emmons E9 and Emmons C6 copedents ship as built-in presets so the app is immediately usable. Preset data is an implementation task — use standard Emmons configurations as the reference.

### Live Preview

The fretboard updates in real time as the copedent is being edited.

---

## Component Architecture

```
App
├── CopedentManager          select / create / delete copedents
├── CopedentEditor           form builder + import/export
│   ├── GuitarConfig         name, pedals, levers, string count
│   ├── StringSetup          open note per string
│   └── ChangesMatrix        string × control grid
├── ControlPanel             pedal/lever toggles + display options
│   ├── PedalToggles
│   ├── LeverToggles
│   └── DisplayOptions       note mode, key selector
└── Fretboard                SVG visualization
    ├── FretLines
    ├── Strings
    ├── NoteIndicators
    └── FretMarkers
```

**State management:** All state lives at the App level (or in a React context provider). Active copedent, engaged controls, and display mode flow down as props. The Fretboard component is pure derived state — no logic of its own, just renders what it receives.

---

## Hosting

Static deploy — Vercel, Netlify, or GitHub Pages. The build output is just HTML, CSS, and JS.

---

## Future Considerations (not in v1)

- Backend + user accounts for saving/sharing copedents
- Community copedent library
- Audio playback (hear the notes)
- Chord/scale highlighting overlays
- Print-friendly copedent charts
