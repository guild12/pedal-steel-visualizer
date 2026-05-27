# Per-Control String-Line Coloring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show pedal/lever engagement by coloring the string lines (per control) instead of turning note dots red, and tint the control buttons as a legend.

**Architecture:** A new `controlColors` util maps each control name to a fixed color. `StringLines` colors each string's line by the engaged control(s) moving it (solid for one, dashed-interleaved for several). `NoteIndicators` drops its red highlight fill so dots are purely chord-colored. `ToggleButton`/`ControlPanel` tint each button with its control color.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest + Testing Library, Tailwind 4, SVG.

---

### Task 1: Control color util

**Files:**
- Create: `src/utils/controlColors.ts`
- Test: `src/utils/controlColors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/controlColors.test.ts
import { describe, it, expect } from 'vitest'
import { getControlColor } from './controlColors'

describe('getControlColor', () => {
  it('returns the fixed color for known control names', () => {
    expect(getControlColor('A')).toBe('#E63946')
    expect(getControlColor('LKL')).toBe('#8338EC')
  })

  it('maps letter and number pedals that share a slot to the same color', () => {
    expect(getControlColor('A')).toBe(getControlColor('1'))
    expect(getControlColor('B')).toBe(getControlColor('2'))
    expect(getControlColor('C')).toBe(getControlColor('3'))
  })

  it('returns a stable hex fallback for unknown names', () => {
    const first = getControlColor('ZZZ')
    expect(first).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(getControlColor('ZZZ')).toBe(first)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/utils/controlColors.test.ts`
Expected: FAIL — cannot find module `./controlColors`.

- [ ] **Step 3: Write the implementation**

```ts
// src/utils/controlColors.ts

/** Fixed display color per control name. Pedals A/1, B/2, C/3 share a slot. */
export const CONTROL_COLORS: Record<string, string> = {
  A: '#E63946', '1': '#E63946',
  B: '#4895EF', '2': '#4895EF',
  C: '#43AA8B', '3': '#43AA8B',
  '4': '#F3722C',
  '5': '#9D4EDD',
  '6': '#FF6B9D',
  '7': '#06D6A0',
  '8': '#FFD166',
  LKL: '#8338EC',
  LKR: '#3A86FF',
  LKV: '#FB5607',
  VLOCK: '#FFBE0B',
  RKL: '#FF006E',
  RKR: '#00B4D8',
  RKR2: '#80B918',
}

const FALLBACK_PALETTE = [
  '#E76F51', '#2A9D8F', '#E9C46A', '#264653',
  '#A8DADC', '#BC6C25', '#588157', '#6D597A',
]

/** Stable color for a control name: fixed map, else a hashed palette slot. */
export function getControlColor(name: string): string {
  const fixed = CONTROL_COLORS[name]
  if (fixed) return fixed
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/utils/controlColors.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/controlColors.ts src/utils/controlColors.test.ts
git commit -m "feat(colors): add per-control color map util"
```

---

### Task 2: Color the string lines

**Files:**
- Modify: `src/components/Fretboard/StringLines.tsx` (full rewrite)
- Modify: `src/components/Fretboard/Fretboard.tsx:119-123` (StringLines props)
- Test: `src/components/Fretboard/StringLines.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Fretboard/StringLines.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StringLines } from './StringLines'
import { getControlColor } from '../../utils/controlColors'
import type { StringConfig } from '../../types'

const strings: StringConfig[] = [
  { number: 1, openNote: 'E4', changes: [{ control: 'A', semitones: 2 }] },
  { number: 2, openNote: 'B3', changes: [{ control: 'A', semitones: 2 }, { control: 'C', semitones: 1 }] },
  { number: 3, openNote: 'G#3', changes: [{ control: 'B', semitones: 1 }] },
]

function renderLines(engaged: string[]) {
  return render(
    <svg>
      <StringLines
        strings={strings}
        engagedControls={new Set(engaged)}
        fretboardHeight={300}
        totalWidth={500}
      />
    </svg>
  )
}

describe('StringLines', () => {
  it('renders gray lines when no controls are engaged', () => {
    const { container } = renderLines([])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    expect(lines.length).toBe(3)
    lines.forEach(l => expect(l.getAttribute('stroke')).toBe('#9ca3af'))
  })

  it('colors strings moved by one engaged control with that control color', () => {
    const { container } = renderLines(['A'])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    const colored = lines.filter(l => l.getAttribute('stroke') === getControlColor('A'))
    expect(colored.length).toBe(2) // strings 1 and 2
  })

  it('draws two dashed lines for a string moved by two engaged controls', () => {
    const { container } = renderLines(['A', 'C'])
    const lines = Array.from(container.querySelectorAll('.string-lines line'))
    const dashed = lines.filter(l => l.getAttribute('stroke-dasharray'))
    expect(dashed.length).toBe(2) // string 2: A + C
    const strokes = dashed.map(l => l.getAttribute('stroke'))
    expect(strokes).toContain(getControlColor('A'))
    expect(strokes).toContain(getControlColor('C'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/Fretboard/StringLines.test.tsx`
Expected: FAIL — StringLines does not accept `strings`/`engagedControls` (type error / no colored lines).

- [ ] **Step 3: Rewrite StringLines**

```tsx
// src/components/Fretboard/StringLines.tsx
import type { JSX } from 'react'
import type { StringConfig } from '../../types'
import { getStringY, getStringThickness } from '../../utils/fretUtils'
import { getControlColor } from '../../utils/controlColors'

interface StringLinesProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  fretboardHeight: number;
  totalWidth: number;
}

const DASH = 12

export function StringLines({ strings, engagedControls, fretboardHeight, totalWidth }: StringLinesProps) {
  const lines: JSX.Element[] = []

  strings.forEach((s, i) => {
    const y = getStringY(i, strings.length, fretboardHeight)
    const thickness = getStringThickness(i, strings.length)
    const affecting = s.changes
      .map(c => c.control)
      .filter(control => engagedControls.has(control))

    if (affecting.length === 0) {
      lines.push(
        <line key={i} x1={0} y1={y} x2={totalWidth} y2={y}
          stroke="#9ca3af" strokeWidth={thickness} />
      )
    } else if (affecting.length === 1) {
      lines.push(
        <line key={i} x1={0} y1={y} x2={totalWidth} y2={y}
          stroke={getControlColor(affecting[0])} strokeWidth={thickness} />
      )
    } else {
      affecting.forEach((control, ci) => {
        lines.push(
          <line key={`${i}-${control}`} x1={0} y1={y} x2={totalWidth} y2={y}
            stroke={getControlColor(control)} strokeWidth={thickness}
            strokeDasharray={`${DASH},${DASH * (affecting.length - 1)}`}
            strokeDashoffset={ci * DASH} />
        )
      })
    }
  })

  return <g className="string-lines">{lines}</g>
}
```

- [ ] **Step 4: Update Fretboard to pass the new props**

In `src/components/Fretboard/Fretboard.tsx`, replace the `<StringLines .../>` block (around lines 119-123):

```tsx
          <StringLines
            strings={copedent.strings}
            engagedControls={engagedControls}
            fretboardHeight={FRETBOARD_HEIGHT}
            totalWidth={totalSvgWidth}
          />
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- --run src/components/Fretboard/StringLines.test.tsx src/components/Fretboard/Fretboard.test.tsx`
Expected: PASS (StringLines 3 tests + existing Fretboard tests still green).

- [ ] **Step 6: Commit**

```bash
git add src/components/Fretboard/StringLines.tsx src/components/Fretboard/StringLines.test.tsx src/components/Fretboard/Fretboard.tsx
git commit -m "feat(fretboard): color string lines by engaged control"
```

---

### Task 3: Remove the red dot highlight

**Files:**
- Modify: `src/components/Fretboard/NoteIndicators.tsx:54-57`
- Test: `src/components/Fretboard/NoteIndicators.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Fretboard/NoteIndicators.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NoteIndicators } from './NoteIndicators'
import { E9_PRESET } from '../../data/presets'

const baseProps = {
  strings: E9_PRESET.strings,
  engagedControls: new Set(['A']),
  displayMode: 'letters' as const,
  selectedKey: 'C',
  fretboardWidth: 500,
  fretboardHeight: 300,
  leftMargin: 50,
  chordNotes: null,
  colorTheme: 'chordTones' as const,
}

describe('NoteIndicators', () => {
  it('does not paint pedal-altered non-chord notes red', () => {
    const { container } = render(<svg><NoteIndicators {...baseProps} /></svg>)
    const circles = Array.from(container.querySelectorAll('circle'))
    const red = circles.filter(c => (c.getAttribute('fill') ?? '').toLowerCase() === '#e63946')
    expect(red.length).toBe(0)
  })

  it('still flags altered notes via data-highlighted', () => {
    const { container } = render(<svg><NoteIndicators {...baseProps} /></svg>)
    expect(container.querySelectorAll('[data-highlighted="true"]').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/Fretboard/NoteIndicators.test.tsx`
Expected: FAIL on the first test — red circles still present (engaged control paints them `#e63946`).

- [ ] **Step 3: Edit the fallback colors**

In `src/components/Fretboard/NoteIndicators.tsx`, replace the `else` branch (lines 53-57):

```tsx
      } else {
        // Non-chord note (or no chord active). Pedal/lever engagement is shown
        // on the string lines now, so dots stay neutral regardless of isHighlighted.
        fillColor = '#1f2937'
        strokeColor = '#4b5563'
      }
```

Leave the `isHighlighted` computation and the `data-highlighted` attribute on the `<g>` untouched — they no longer affect color but other tests rely on the attribute.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/components/Fretboard/NoteIndicators.test.tsx src/components/Fretboard/Fretboard.test.tsx`
Expected: PASS (both NoteIndicators tests + Fretboard's `data-highlighted` tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard/NoteIndicators.tsx src/components/Fretboard/NoteIndicators.test.tsx
git commit -m "feat(fretboard): stop painting note dots red on engagement"
```

---

### Task 4: Tint the control buttons (legend)

**Files:**
- Modify: `src/components/ControlPanel/ToggleButton.tsx` (full rewrite)
- Modify: `src/components/ControlPanel/ControlPanel.tsx:38-45,54-61` (pass color)
- Test: `src/components/ControlPanel/ToggleButton.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ControlPanel/ToggleButton.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleButton } from './ToggleButton'

describe('ToggleButton', () => {
  it('tints the border with the control color when idle', () => {
    render(<ToggleButton label="A" engaged={false} color="#E63946" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.getAttribute('data-engaged')).toBe('false')
    expect(btn.style.borderColor).toBeTruthy()
  })

  it('fills with the control color when engaged', () => {
    render(<ToggleButton label="A" engaged={true} color="#E63946" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'A' })
    expect(btn.getAttribute('data-engaged')).toBe('true')
    expect(btn.style.backgroundColor).toBeTruthy()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ToggleButton label="A" engaged={false} color="#E63946" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/ControlPanel/ToggleButton.test.tsx`
Expected: FAIL — `ToggleButton` has no `color` prop; `style.borderColor`/`backgroundColor` empty.

- [ ] **Step 3: Rewrite ToggleButton**

```tsx
// src/components/ControlPanel/ToggleButton.tsx
interface ToggleButtonProps {
  label: string;
  engaged: boolean;
  color: string;
  onClick: () => void;
}

export function ToggleButton({ label, engaged, color, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      data-engaged={engaged ? 'true' : 'false'}
      style={engaged
        ? { backgroundColor: color, borderColor: color, color: '#fff' }
        : { borderColor: color, color }
      }
      className="px-4 py-2 rounded font-mono text-sm font-bold border-2 bg-gray-800 transition-colors"
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 4: Pass color from ControlPanel**

In `src/components/ControlPanel/ControlPanel.tsx`, add the import at the top:

```tsx
import { getControlColor } from '../../utils/controlColors'
```

Replace the pedals `ToggleButton` (lines 38-45):

```tsx
          {pedals.map(p => (
            <ToggleButton
              key={p}
              label={p}
              engaged={engagedControls.has(p)}
              color={getControlColor(p)}
              onClick={() => onToggleControl(p)}
            />
          ))}
```

Replace the knee-levers `ToggleButton` (lines 54-61):

```tsx
            {kneeLevers.map(l => (
              <ToggleButton
                key={l}
                label={l}
                engaged={engagedControls.has(l)}
                color={getControlColor(l)}
                onClick={() => onToggleControl(l)}
              />
            ))}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- --run src/components/ControlPanel/ToggleButton.test.tsx src/components/ControlPanel/ControlPanel.test.tsx`
Expected: PASS (ToggleButton 3 tests + existing ControlPanel tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ControlPanel/ToggleButton.tsx src/components/ControlPanel/ToggleButton.test.tsx src/components/ControlPanel/ControlPanel.tsx
git commit -m "feat(controls): tint pedal/lever buttons with control colors"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`
Expected: PASS — all suites green (was 206; new tests added).

- [ ] **Step 2: Typecheck/build**

Run: `npm run build`
Expected: succeeds. NOTE: there is a pre-existing unrelated error in `ChordAnalyzerBadge.tsx` (`hasEngagedControls` unused) tracked separately — if the build still fails only on that line, it is not caused by this work. Confirm no new errors from the files in this plan.

- [ ] **Step 3: Visual check in the running app**

With `npm run dev` running: select the E9 (or Universal) copedent, engage the A pedal, and confirm: strings 5 & 10 lines turn the A color, the A button is filled with that color, and the note dots are NOT red. Engage a second pedal that shares a string (e.g. C) and confirm that shared string shows an alternating dashed two-color line.

- [ ] **Step 4: Commit any tuning**

If colors need tweaking after the visual check, adjust `CONTROL_COLORS` in `src/utils/controlColors.ts` and commit:

```bash
git add src/utils/controlColors.ts
git commit -m "chore(colors): tune control color palette"
```

---

## Self-Review

- **Spec coverage:** controlColors util (Task 1 ✓), string-line coloring solid/dashed (Task 2 ✓), remove dot red (Task 3 ✓), button legend (Task 4 ✓), data flow via Fretboard/ControlPanel (Tasks 2 & 4 ✓), testing (each task + Task 5 ✓). No gaps.
- **Placeholders:** none — every code step has full code; `FALLBACK_PALETTE` is concrete.
- **Type consistency:** `getControlColor(name: string): string` used identically in Tasks 2 and 4; `StringLinesProps` matches the Fretboard call site; `ToggleButtonProps` adds `color: string` and ControlPanel supplies it.
