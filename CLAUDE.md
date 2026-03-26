# CLAUDE.md - Pedal Steel Visualizer

## What This Is

An interactive pedal steel guitar visualizer built for learning and exploring the instrument. Displays a fretboard with note positions, chord detection, color-coded chord functions (root/third/fifth/seventh/extensions), alternative chord voicings, and transition scoring between positions.

## Tech Stack

- **React 19** + **TypeScript** — strict mode, no `any` types
- **Vite 8** — dev server and build
- **Tailwind CSS 4** — styling via `@tailwindcss/vite` plugin
- **Vitest** + **Testing Library** — unit and component tests
- **ESLint** — with react-hooks and react-refresh plugins

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm test` — run tests (vitest)
- `npm run lint` — run eslint

## Project Structure

```
src/
  components/     — React components (ChordVisualization, ControlPanel, CopedentEditor, CopedentManager, Fretboard)
  data/           — copedent presets and instrument data
  hooks/          — custom React hooks
  types/          — TypeScript type definitions
  utils/          — core logic (chord detection, note utils, fret utils, voicing search, transition scoring, chord function colors)
```

Utils have colocated test files (`*.test.ts`). Keep that pattern.

## Conventions

- Conventional commits: `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, etc.
- Color themes are user-selectable and persisted to localStorage — any new visual feature must respect the active `colorTheme`.
- Chord function coloring follows a hierarchy: root > third > fifth > seventh > extensions. Extensions always get extension color regardless of context.
- Components receive data via props, not global state. State lives in App.tsx and flows down.

## Working With Gabe

Gabe has ADHD. These rules exist to keep sessions productive.

### Be Concise
- Short responses by default. Save context window for code, not commentary.
- Don't repeat back what Gabe said. Don't summarize what you're about to do. Just do it.
- When you make a mistake, fix it fast — don't over-explain or over-apologize.

### Focus Management
- **Session anchor:** At session start, check for any prior context (recent commits, open branches). State where things left off and ask if that's still the plan.
- **Drift detection:** If Gabe brings up something unrelated, flag it: "That sounds separate — want to note it and stay on track, or switch?" Default is stay on track.
- **Never stall.** If you say "let me do X" — immediately do X.

### Session Discipline
- At the end of sessions, remind Gabe to commit and push.
- If the session is getting long, suggest wrapping up rather than risking a context crash.

## Music Theory Context

If you need pedal steel background:
- A **copedent** is the tuning chart for a pedal steel — defines open string pitches and what each pedal/lever does (raise/lower specific strings by specific intervals).
- Standard tunings: E9 (melody/jazz), C6 (western swing/jazz). This app supports custom copedents.
- **Chord voicings** on pedal steel are found by combining open strings + pedal/lever combinations, not by fretting shapes like guitar.
- **Transitions** between voicings have a cost based on how many pedals/levers change and how far the bar moves.
