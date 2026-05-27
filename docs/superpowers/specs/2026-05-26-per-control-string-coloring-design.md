# Per-Control String-Line Coloring — Design

**Date:** 2026-05-26
**Status:** Approved (design)

## Problem

Pedal/lever engagement is currently shown by turning the affected **note dots**
red (`#e63946`) via an `isHighlighted` flag in `NoteIndicators`. This collides
with chord coloring: with pedals down, every pedal-altered non-chord note turns
red, flooding the board with a color that isn't even part of the "Chord Tones"
palette. Two unrelated ideas — "what are the pedals doing mechanically" and
"what notes/chord am I looking at" — fight over the same visual channel (the
dots).

## Goal

Move all pedal/lever engagement feedback off the dots and onto the **string
lines**, color-coded per control. Each control (pedal or lever) has a fixed
color tied to its name. Engaging a control colors the lines of the strings it
moves. Dots become purely about notes/chords again.

Example: on E9, pressing the **A** pedal turns the string-5 and string-10
*lines* red (A's color), regardless of what chord is being analyzed on the dots.

## Scope

- **In scope:** new `controlColors` util; `StringLines` (color the lines);
  `NoteIndicators` (remove the red `isHighlighted` fallback); `ToggleButton` /
  `ControlPanel` (tint buttons as a legend); `Fretboard` (pass data through).
- **Out of scope:** chord detection/scoring, the extension-color regex bug
  (separate fix), the altered-tension relabel (separate spec), note-dot chord
  coloring logic.

## Design

### 1. Control color source — `src/utils/controlColors.ts` (new)

Fixed map keyed by control name, plus a deterministic fallback for unknown
custom names:

```ts
export const CONTROL_COLORS: Record<string, string> = {
  // Pedals (A/1, B/2, C/3 share a color — "first/second/third pedal")
  A: '#E63946', '1': '#E63946',
  B: '#4895EF', '2': '#4895EF',
  C: '#43AA8B', '3': '#43AA8B',
  '4': '#F3722C',
  '5': '#9D4EDD',
  '6': '#FF6B9D',
  '7': '#06D6A0',
  '8': '#FFD166',
  // Knee levers
  LKL: '#8338EC',
  LKR: '#3A86FF',
  LKV: '#FB5607',
  VLOCK: '#FFBE0B',
  RKL: '#FF006E',
  RKR: '#00B4D8',
  RKR2: '#80B918',
};

const FALLBACK_PALETTE = [ /* ~8 distinct hues */ ];

export function getControlColor(name: string): string {
  if (CONTROL_COLORS[name]) return CONTROL_COLORS[name];
  // stable hash of the name → palette index (same name → same color every render)
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
}
```

Exact hexes are tunable; the contract is "stable color per name."

### 2. String lines — `StringLines.tsx`

New props: `strings: StringConfig[]` and `engagedControls: Set<string>`.

For each string, compute the engaged controls that move it:
`affecting = string.changes.filter(c => engagedControls.has(c.control)).map(c => c.control)`.

Render per string:
- **0 affecting controls** → current gray line (`#9ca3af`), unchanged.
- **1** → solid line in `getControlColor(control)`.
- **2+** → dashed line alternating each control's color. Implementation: draw
  one overlaid `<line>` per affecting control, each with
  `strokeDasharray="DASH, DASH*(N-1)"` and `strokeDashoffset = i*DASH`, so the N
  colors interleave as evenly spaced dashes along the same line.

String thickness (`getStringThickness`) is preserved in all cases. The line
spans the full width as today (a pedal bends the string at every fret).

### 3. Note dots — `NoteIndicators.tsx`

Remove the red `isHighlighted` branch. Non-chord notes always render neutral
(`#1f2937` fill / `#4b5563` stroke). Chord tones/extensions keep their resolved
colors. (Keep the `data-highlighted` attribute computation if existing tests
assert on it — verify during implementation — but it no longer affects fill.)

### 4. Button legend — `ToggleButton.tsx` / `ControlPanel.tsx`

Each pedal/lever button carries its control color (via inline style, since the
colors are arbitrary hex, not Tailwind tokens):
- **Idle:** colored border + colored label text, dark background.
- **Engaged:** filled with the control color, contrasting text.

`ControlPanel` already has each control name; it passes
`color={getControlColor(name)}` to `ToggleButton`. This makes the buttons the
legend — no separate key needed.

### 5. Data flow

No new App-level state. `Fretboard` already receives `copedent` and
`engagedControls`; it forwards `strings={copedent.strings}` and
`engagedControls` to `StringLines`. `ControlPanel` imports `getControlColor`
directly.

## Testing

- **controlColors:** known names map to expected colors; A/1 (etc.) share;
  unknown name returns a stable palette color (same on repeat calls).
- **StringLines:** with one engaged control, the moved strings render a line in
  that control's color and others stay gray; with two engaged controls on a
  shared string, that string renders multiple colored (dashed) lines.
- **NoteIndicators (Bug-2 regression):** with a control engaged and a fret whose
  altered note is not a chord tone, the dot is **not** red (neutral gray).
- All existing tests continue to pass (currently 206); update any that assert on
  the old red-dot behavior.

## Risks

- On the 14-control Universal, a string moved by several engaged controls shows
  several interleaved dash colors — potentially busy, but only when many
  controls are engaged at once. Acceptable.
- Arbitrary hex requires inline styles on buttons/lines rather than Tailwind
  classes. Acceptable and localized.
