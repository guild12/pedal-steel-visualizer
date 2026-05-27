# Move-To Navigator — Design

**Date:** 2026-05-27
**Status:** Approved (design); ready for implementation planning
**Working name:** "Move To" navigator (rename TBD before ship)

## Problem / use case

When learning or arranging a song, a player is on one chord (e.g. the I) and needs
to reach the next chord (e.g. the IV). The question they have is concrete and
spatial: *"From where my bar is right now, what bar movement and which pedals/levers
get me to that next chord?"*

The existing Transition tool answers a related but abstract question (pair two named
chords, list the cheapest voicing pairs as text). It is not anchored to the player's
live position and does not draw the move on the fretboard. This feature fills that
gap: a position-anchored, on-fretboard "get me there" navigator that can be stepped
through a song one chord at a time.

Key pedal-steel insight driving the design: on a chart you read **absolute** chord
names, but the move itself is **relative** — e.g. pressing the A pedal hands you the
IV at the *same fret* with no bar movement. Surfacing those "don't move the bar, just
press a pedal" moves as the easiest options is the pedagogical payoff.

## Scope

**In scope (this build):**
- Single move: from the live current position to one chosen target chord.
- Absolute target chord entry (chart-style, e.g. "A maj").
- On-fretboard visualization of all target voicings, ranked by move effort.
- Inspect a candidate; commit ("Move here") to drive the live app state to it.
- A "living" mode that stays open and recomputes from the new position after each
  commit, enabling continuous step-through of a progression by hand.

**Deferred (out of scope, by design):**
- Animated/scrubbable slide of the bar between positions (the "C" mockup). The data
  to support it exists; the animation layer is a later pass.
- Roman-numeral / key-relative target entry ("go to the IV" against a set key).
- Automatic full-progression routing (enter I-IV-V-I, optimize the whole path). The
  commit-advance step is the seam this would build on.
- Consolidating this with the existing abstract Transition tool. **Decision: keep
  Transition as a separate, untouched mode.**

## Concept / user loop

1. Source = the player's **live current position**: `selectedFret` (defaulting to 0
   when null) + the current `engagedControls`, which is exactly what the detected
   "current chord" already reflects. No separate "from" picker.
   - Minor convenience: a source-chord seed (pick a chord name → set a representative
     voicing as the current position) so the player can start cold. Low priority; can
     be dropped if it complicates the build.
2. Player picks the **target chord** (absolute) from the existing `ChordPicker`.
3. The fretboard lights up **every place that target chord lives** within fret range,
   as ghost tone-bars, color-coded green→amber→red by how little effort the move from
   the current position takes. Each is labeled with the control delta (e.g. `+P1 +LKL`).
4. Player **clicks a ghost to inspect** it — a panel shows the exact pedals/levers to
   press and release, common tones held, target fret, and resulting notes.
5. Player hits **"Move here"** to commit: the app sets `engagedControls` to that
   voicing and moves the bar to that fret. The ControlPanel buttons physically light
   up, the bar repositions, and chord detection re-runs. This becomes the new current
   position.
6. The mode stays open; rankings recompute from the new position, ready for the next
   target chord. Repeat to step through a song.

## UX placement

Move-To is the **third mode**, following the exact pattern of the existing Chord
Finder and Transition modes:
- A toggle button in `ControlPanel` (alongside "Chord Finder" / "Transition").
- The target chord picker appears above the fretboard when active.
- The ranked ghost-bar overlay renders on the fretboard; the inspect / "Move here"
  panel renders below.
- Activating Move-To deactivates Chord Finder and Transition (mutually exclusive),
  matching the current `activate*` behavior in `useChordState`.

**Deliberate difference from the other modes:** Chord Finder and Transition are
dead-ends (display only). Move-To is a *living* mode — committing a move updates the
live position, so the overlay recomputes in place rather than the mode resetting.

## Ranking / effort model

Reuse the existing effort math in `transitionScoring.ts`. Today `calculateEffort` is
private and takes two `VoicingResult`s; generalize it so the source can be an
arbitrary live position rather than a named-chord voicing.

- Candidate targets come from `findVoicings(targetRoot, targetQuality, copedent)` —
  all voicings of the target across frets (best voicing kept per fret for the overlay,
  as `ChordFinderOverlay` already does).
- Each candidate is scored **from the current position**:
  `fretDistance * 10 + controlChanges.length * 5 − commonTones * 2`
  (same weights as today; `controlChanges` are press/release deltas between the
  current `engagedControls` and the candidate's).
- Lower score = easier. Same-fret / zero-bar-movement moves (e.g. "just press A")
  naturally score lowest and should be badged as the easiest, no-slide options.
- Color buckets (green→amber→red) map from score; the palette must respect the active
  `colorTheme` (see Conventions).

New exported function (name TBD), e.g.:
`scoreMove(source: { fret: number; engagedControls: Set<string>; notes: VoicingNote[] }, target: VoicingResult): TransitionEffort`
The existing two-voicing `findTransitions` path stays as-is for the Transition mode.

## Components / files touched

- **`src/utils/transitionScoring.ts`** — extract/generalize effort scoring into an
  exported `scoreMove(sourcePosition, targetVoicing)`. Leave `findTransitions` intact.
- **`src/components/.../MoveToOverlay.tsx`** (new) — ranked ghost tone-bars on the
  fretboard, sibling of `ChordFinderOverlay`; reuses the tone-bar shape and adds
  ease-based coloring + control-delta labels + an "easiest / no bar move" badge.
- **`src/components/.../MoveToPanel.tsx`** (new) — target chord picker + inspect
  detail + "Move here" button. May borrow `TransitionResults` styling/layout.
- **`src/hooks/useChordState.ts`** — add a `moveTo` mode/state
  (`{ active, targetChord, results, inspectedIndex }`) and actions
  (`activateMoveTo`, `deactivateMoveTo`, `inspectMoveResult`, plus a commit handler
  wired in App). Activating it clears `chordFinder` and `chordTransition`.
- **`src/hooks/useCopedentState.ts`** — add `setControls(controls: string[])` to set
  engaged controls wholesale (only `toggleControl` and `clearAllControls` exist now).
  Used by the commit action.
- **`src/App.tsx`** — wire the new mode: feed it the live source position
  (`selectedFret ?? 0` + `engagedControls`), render the picker/overlay/panel, and
  implement "Move here" as `setControls(target.engagedControls)` +
  `selectFret(target.fret)`.

## Conventions to honor

- **Color themes:** ease colors (green/amber/red) must derive from / respect the
  active `colorTheme`, not be hardcoded. Control-delta labels should use the existing
  per-control colors (`controlColors.ts`) where it reads cleanly.
- **Tone-bar shape:** reuse the existing selected-fret tone-bar shape for ghost bars
  (domed top, flat bottom), sized for clearance as established.
- **Data flow:** props down from `App.tsx`; no new global state beyond the hooks
  noted above. Mutually-exclusive mode toggling mirrors the existing modes.
- **Tests:** colocated `*.test.ts` for `scoreMove`; a component test covering overlay
  ranking/coloring and the commit-advances-position behavior.

## Open questions for implementation planning

- Final name for the mode and the `scoreMove` export.
- Exact score→color bucket thresholds (and whether the active theme already exposes a
  suitable green/amber/red triad or one must be added).
- Whether to keep or drop the optional source-chord seed.
- Whether the inspect panel reuses `TransitionResults` markup or gets its own.
