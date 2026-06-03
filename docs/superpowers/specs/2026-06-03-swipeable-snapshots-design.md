# Swipeable Snapshots — Design

**Date:** 2026-06-03
**Status:** Approved — implementing Approach A
**Branch:** claude/cranky-nash-18b4bc

## Origin / Motivation

While the dev server was running, Gabe noticed that a **two-finger swipe** in Safari, on a
single tab, let him flip between what looked like *independent live instances of the same page* —
toggle the A pedal on one, swipe, toggle the B pedal on another, swipe back and forth, and each
kept its own state.

**What's actually happening:** Safari's **back/forward cache (bfcache / "Page Cache")**. Two-finger
swipe triggers history back/forward navigation. Instead of reloading the app, Safari freezes the
entire live page (DOM + full JS heap) and restores that frozen instance on return. Each history
entry is therefore an independent, fully-stateful snapshot. (Unconfirmed: exactly how the multiple
history entries got created — preservation is definitely bfcache; entry *creation* needs a
navigation/reload per entry.)

**The idea worth keeping:** gesture-driven *parallel stateful instances* — flip between multiple
independent configurations of one app with a physical swipe, no save/load dialog, no tabs, no UI
chrome. For a pedal steel tool this is powerful: snapshot several voicings / pedal setups and swipe
to A/B/C/D-compare them instantly. The concept generalizes to most apps.

## Requirements (agreed)

1. **Snapshot scope:** each snapshot is a *fully independent app instance* — copedent/tuning, bar
   fret, engaged pedals/levers, chord override, muted notes, and display settings (Letters vs Scale
   Degrees, Extensions toggle, color mode/theme). Everything that defines what's on screen.
2. **Count:** unlimited.
3. **Creation:** two ways —
   - **`+` button** → offers a choice: **clone current** or **blank default**.
   - **Swipe past the last snapshot** → spawns a new one that **clones current** (fast flow,
     mirrors the Safari feel).
4. **Persistence:** snapshots *and* the active index persist to **localStorage**, restored next
   session (consistent with the app's other prefs).
5. **Controls / indicators:**
   - **Two-finger swipe** (primary gesture).
   - **Pager dots** — show count + active; click a dot to jump; the active dot carries a delete (×)
     affordance ("Delete current").
   - **Prev / Next arrows** — on-screen ‹ › for discoverability / non-trackpad.
   - (Not doing keyboard arrow navigation for now.)

## Approaches Considered

### Approach A — Serialize / restore  ✅ CHOSEN

One live working state (the existing hooks). A `snapshots[]` array holds serialized state blobs plus
an `activeIndex`. Switching = write current live state into `snapshots[old]`, then hydrate
`snapshots[new]` into the live hooks.

- **Pros:** smallest change; existing components untouched; serialization is required for
  localStorage anyway, so persistence comes "for free"; explicit and testable.
- **Cons:** every per-snapshot state hook needs a clean `serialize()` / `hydrate()` pair; switching
  performs a bulk setState.

### Approach B — Lift state into a snapshot store

The `snapshots[]` array becomes the single source of truth; the active snapshot's fields flow down
as props.

- **Pros:** cleanest long-term data model.
- **Cons:** touches every hook and consumer — biggest refactor / most risk for an experimental
  feature.

### Approach C — Mount N live React instances (the literal Safari trick)

Render one `<Visualizer>` subtree per snapshot, keep all mounted, show only the active via CSS. Each
truly keeps its own state; no serialize/hydrate for in-memory switching; any future state "just
works."

- **Pros:** purest match to the observed Safari behavior.
- **Cons:** N subtrees mounted at once (perf with many snapshots); localStorage-backed globals
  (presets, color theme) would be written by every instance → conflicts; still needs serialization
  for persistence anyway.

**Decision:** A. Persistence forces serialization regardless, so A reuses that machinery for
switching, keeps blast radius small, and is the most testable. Revisit B if the data model needs to
scale; revisit C if we want true zero-serialization in-memory instances and can solve the shared
-localStorage conflict.

## Architecture (Approach A)

### Data model

```
SnapshotState   // the serialized, per-snapshot blob — exact fields enumerated from the hooks
                // during implementation. Covers: activeCopedent, engagedControls, selectedFret,
                // overrideChord, mutedNotes, showExtensions, display mode, color mode/theme,
                // and any chordState sub-state intended to be per-snapshot.

SnapshotsModel {
  snapshots: SnapshotState[]
  activeIndex: number
}
```

- A `useSnapshots` hook owns `SnapshotsModel`, persists it to localStorage, and exposes:
  `goTo(i)`, `next()`, `prev()`, `addClone()`, `addBlank()`, `deleteCurrent()`.
- Each existing state hook gains `serialize()` (read current → blob slice) and `hydrate(blob)`
  (write blob slice → state). The switch operation composes these across all hooks.
- **Switch sequence:** `serialize()` all hooks → store into `snapshots[activeIndex]` →
  set `activeIndex` → `hydrate(snapshots[newIndex])` into all hooks.

### Gesture layer

- A `useSwipe` (or `useHorizontalSwipe`) hook on the main visualizer container:
  - **Trackpad:** listen to `wheel`; accumulate `deltaX` (ignore when `ctrlKey`/pinch-zoom);
    threshold + momentum debounce to fire one `onSwipeLeft` / `onSwipeRight` per gesture.
  - **Touch:** `touchstart`/`touchmove`/`touchend` with a horizontal distance + velocity threshold.
- **Critically, suppress the browser's own back/forward gesture** (the thing that started this):
  `overscroll-behavior-x: contain` on the scroll container, plus `preventDefault()` on handled
  horizontal wheel events. This is what makes swipe drive *our* snapshots instead of browser history.
- Swipe right → `prev()`; swipe left → `next()`; swiping left past the end → `addClone()`.

### UI

- A **SnapshotPager** component: row of dots (active highlighted, click to `goTo`), ‹ › arrows
  (`prev`/`next`), `+` button (popover: clone vs blank), and a delete (×) on the active dot.
- Lives alongside the existing control panel; respects the active `colorTheme` (per project rules).

### Persistence

- `useSnapshots` reads/writes one localStorage key (e.g. `pedalSteel.snapshots.v1`) containing
  `{ snapshots, activeIndex }`. Versioned key for forward migration. Self-heals on malformed data
  (fall back to a single default snapshot), consistent with existing preset self-heal behavior.

### Testing

- Unit-test `serialize`/`hydrate` round-trips for each hook (blob in === state out).
- Unit-test `useSnapshots` reducers: add clone/blank, delete current (incl. deleting the last/only
  one), goTo/next/prev bounds, swipe-past-end creates clone.
- Unit-test the swipe-threshold logic (deltaX accumulation → single fire; ignore pinch).
- Component test: pager renders N dots, click jumps, delete removes.

## Open questions / deferred

- Exact field list per snapshot — enumerate by reading the state hooks during implementation.
- Whether `chordFinder` / `moveTo` transient panel state is per-snapshot or reset on switch
  (lean: reset transient panels on switch; keep core playing state).
- Min/empty state: always at least one snapshot; deleting the last creates a fresh default.
- Migration if the localStorage schema changes later (versioned key handles this).
