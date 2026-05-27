# Altered-Tension Relabeling — Design

**Date:** 2026-05-26
**Status:** Approved (design)

## Problem

The chord detector labels any pitch class not in the detected chord's interval
set as an "extension." This produces musically wrong labels when an *altered*
note coexists with the natural chord tone of the same scale degree. For example,
on an `E7` voicing that also contains `Bb`, the `Bb` was shown as a `b5`
extension — but `E7` already has a perfect 5th (`B`), so a "b5 extension" is
incoherent. The note is really a `#11`.

A previous commit (`4ac0ee0`) addressed the *confusing label* by **suppressing**
such clashes (hiding `b3` against a natural 3, `b5`/`#5` against a perfect 5).
That removed the misleading label but also discarded genuinely useful tension
information (the `#9` in a 7#9 voicing, the `#11` Lydian color, etc.).

## Goal

When an altered note coexists with the natural chord tone of that degree,
**relabel it to its correct upper-structure tension and keep showing it** as an
extension — on all chord types. Do not hide it.

This complements the dictionary work in the same prior commit: when the natural
tone is *absent*, the altered note is a chord tone of an altered quality
(`7b5`, `aug`, `maj7#5`, …) and is named by the dictionary, never reaching the
extension list. The two mechanisms together keep "E7♭5" (b5 replaces 5) and
"E7 with a #11" (b5 added over an intact 5) cleanly distinct.

## Scope

- **In scope:** the extension-labeling logic in `getExtensions()`
  (`src/utils/chordDetection.ts`), plus unit tests.
- **Out of scope:** detection scoring / ranking (unchanged — the base chord
  still wins and tensions are listed separately), the chord-tone degree row in
  the badge (uses only the chord's own tones), color resolution (already handles
  arbitrary extension labels via the `isExtension` rule in
  `chordFunctionColors.ts`), and any UI component changes.

## Behavior

`getExtensions(root, quality, pitchClasses)` walks each interval present in the
voicing that is not a chord tone and not the root. The current `suppressed`-set
logic is replaced by a relabel step.

### Relabel map

Let `has(iv)` mean the detected chord's interval set (mod 12) contains `iv`.
For a non-chord interval `iv`:

| `iv` | Condition | Resulting label |
|------|-----------|-----------------|
| 3 (b3) | `has(4)` (natural 3 present) | `#9` |
| 6 (b5) | `has(7)` (perfect 5 present) | `#11` |
| 8 (#5) | `has(7)` (perfect 5 present) | `b13` |

In each case the extension is **kept** and emitted as
`` `${label} (${noteName})` `` (the existing format), so the badge shows the
tension name paired with its note letter, in the extension color.

### Non-clash alterations

If the natural degree tone is absent, the altered interval is not produced as an
extension here at all — it will have been folded into the detected chord quality
by the dictionary (`7b5` = `0 4 6 10`, `aug`/`aug7` = `…8…`, `maj7#5` =
`0 4 8 11`, etc.). No change to that path.

### Edge case — minor 3 chord tone + natural 3 in voicing

If the detected chord's third is the minor 3 (`has(3)`) and the voicing also
contains the natural 3 (interval 4), there is no standard tension name for a
major-3-over-minor-3 (a genuine min/maj clash). **This single case stays
hidden** — it is the only residual suppression. (Rare; you do not normally voice
both thirds together.)

### Unchanged extensions

`b9` (1), `9` (2), `4th`/`11` (5), `6th`/`13` (9) keep their current labels and
behavior. Only the three altered-3rd/5th cases above are relabeled.

## Implementation sketch

In `getExtensions`, after computing `chordIntervalsMod12` and `has`:

```ts
// Map a clashing alteration to its upper-structure tension label.
// Returns null when the interval should be hidden (no clean tension name).
function relabelClash(iv: number): string | null {
  if (iv === 3 && has(4)) return '#9';   // b3 over natural 3
  if (iv === 6 && has(7)) return '#11';  // b5 over perfect 5
  if (iv === 8 && has(7)) return 'b13';  // #5 over perfect 5
  if (iv === 4 && has(3)) return null;   // maj3 over min3 — hide (no name)
  return undefined; // not a clash; use the normal label
}
```

For each non-chord, non-root interval:
- `const r = relabelClash(interval)`
- if `r === null` → skip (hidden edge case)
- `const label = r ?? getIntervalLabel(interval)`
- push `` `${label} (${noteName})` ``

`getIntervalLabel` is unchanged.

## Testing

Add unit tests for `getExtensions` (E root unless noted):

1. `E7` + natural 5 (B) + `Bb` → extensions include `#11 (A#)`, not `b5`, not hidden.
2. `E7` + natural 3 (G#) + `G` → extensions include `#9 (G)`.
3. `E7` + natural 5 (B) + `C` (#5) → extensions include `b13 (C)`.
4. Voicing with `b5` and **no** natural 5 → detected as `7b5`; `getExtensions`
   for `7b5` does **not** emit a `#11`/`b5` extension (it's a chord tone).
5. `Cmaj` triad + `F#` → extension `#11 (F#)` — proves "all chords" (Lydian).
6. Minor chord (e.g. `Emin`) voicing that also contains the natural 3 → that
   natural 3 is **not** listed (edge-case suppression).

All existing tests must continue to pass (206).

## Risks

- Pitch-class space has no octave/enharmonic spelling, so relabeling is
  heuristic (e.g. `b5`+5 is always called `#11`, never `b12`). Accepted: these
  are the conventional jazz names and match user intent.
- Detection ranking is untouched, so no regression risk to which chord is named.
