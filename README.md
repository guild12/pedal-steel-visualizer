# Pedal Steel Visualizer

An interactive pedal steel guitar fretboard visualizer for learning and exploring the instrument. Pick a copedent, engage pedals and knee levers, click a fret to place the bar, and see which notes sound, which chord they form, and what each note's function is.

## What it does

- **Fretboard** showing every string's note at the selected bar position, updating as you engage pedals and levers. Notes display as letters or scale degrees (relative to a chosen key).
- **Chord detection** for the current bar position and pedal combination, with alternative interpretations you can switch to.
- **Color-coded chord functions** (root, third, fifth, seventh, extensions). Three color themes: Chord Tones, Root Focus, Per Function. Extensions can be shown or hidden, and individual notes muted on the chord badge.
- **Chord Finder**: choose a target chord and see the bar positions and pedal/lever combinations that produce it on the active copedent.
- **Transitions**: choose two chords and see ranked ways to move between them, scored by pedal/lever changes and bar movement.
- **Move To**: choose a target chord and get ranked moves from your current position, with a "Move here" button that sets the bar and pedals for you.
- **Snapshots**: several independent configurations (copedent, bar position, engaged controls, display options) you can page between.
- **Custom copedents**: edit, duplicate, create, save and load your own.

## What is a copedent?

A copedent (short for "copedent chart") is a pedal steel's setup: the open-string tuning, plus what each pedal and knee lever does (which strings it raises or lowers, and by how much). Two steels with the same tuning can have very different copedents.

## Using it

- **Select the bar position**: click a fret on the fretboard.
- **Engage pedals and levers**: click the pedal and knee lever buttons, or press keys `1`-`9` to toggle the pedals in order (keys map to pedals only, not levers, and are ignored while typing in a text field).
- **Clear**: `Escape` releases all pedals and levers, deselects the fret, and closes Chord Finder, Transitions and Move To. The Clear All button releases pedals and levers only.
- **Snapshots**: use the arrow buttons and dots above the fretboard, or swipe left/right. `+` adds a copy of the current snapshot (swiping left past the last one does the same). `×` deletes the current one.
- **Edit panel**: the Edit button next to the copedent selector opens the copedent editor for the active copedent. New creates a blank copedent; Duplicate copies the active one.
- **Save / Load**: Save downloads the active copedent as a JSON file; Load imports a JSON file as a new copedent.

Copedents are stored in your browser's localStorage. Deleting a built-in preset is reversible, since presets reappear on reload.

## Built-in presets

- Emmons E9
- Emmons C6
- E9/B6 Universal

## Development

Requires Node 22.

```bash
npm install
npm run dev      # dev server
npm test         # vitest
npm run lint     # eslint
npm run build    # typecheck + production build
```

Stack: React 19, TypeScript (strict), Vite, Tailwind CSS 4, Vitest + Testing Library.

## Deployment

The app deploys to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main` (or manually through workflow dispatch). The workflow builds with `BASE_PATH=/pedal-steel-visualizer/`; to build for a project site yourself:

```bash
BASE_PATH=/pedal-steel-visualizer/ npm run build
```

In the repo settings, set Pages source to "GitHub Actions". `.github/workflows/ci.yml` runs lint, tests and build on pushes to `main` and on pull requests.

## Project structure

```
src/
  components/     — React components (ChordVisualization, ControlPanel, CopedentEditor, CopedentManager, Fretboard)
  data/           — copedent presets and instrument data
  hooks/          — custom React hooks
  types/          — TypeScript type definitions
  utils/          — core logic (chord detection, note utils, fret utils, voicing search, transition scoring, chord function colors)
```

Utils have colocated test files (`*.test.ts`).
