import { useState } from 'react'
import type { Copedent } from '../../types'
import { normalizeNoteName, parseNote } from '../../utils/noteUtils'

interface StringSetupProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

/** Returns the normalized note (e.g. "Bb3" -> "A#3") or null when the text is not a complete note. */
function normalizeOrNull(noteStr: string): string | null {
  try {
    const parsed = parseNote(noteStr.trim())
    return normalizeNoteName(parsed.name) + parsed.octave
  } catch {
    return null
  }
}

export function StringSetup({ copedent, onUpdate }: StringSetupProps) {
  // Drafts hold what the user is typing. Only complete, valid notes are committed
  // to the copedent, so a half-typed "F" never reaches the fretboard math.
  const [drafts, setDrafts] = useState<string[]>(() => copedent.strings.map(s => s.openNote))

  // Resync drafts when the copedent changes from outside (import, switch, string
  // add/remove). Done during render (the "adjust state on prop change" pattern)
  // rather than in an effect, so there is no extra render with stale drafts.
  const committed = copedent.strings.map(s => s.openNote).join('|')
  const [prevCommitted, setPrevCommitted] = useState(committed)
  if (committed !== prevCommitted) {
    setPrevCommitted(committed)
    setDrafts(committed === '' ? [] : committed.split('|'))
  }

  const updateDraft = (index: number, noteStr: string) => {
    setDrafts(prev => prev.map((d, i) => (i === index ? noteStr : d)))
    const normalized = normalizeOrNull(noteStr)
    if (normalized && normalized !== copedent.strings[index].openNote) {
      const newStrings = copedent.strings.map((s, i) =>
        i === index ? { ...s, openNote: normalized } : s
      )
      onUpdate({ strings: newStrings })
    }
  }

  // On blur, show the committed (normalized) value: "Gb4" becomes "F#4", and an
  // incomplete entry snaps back to the last valid note.
  const syncDraft = (index: number) => {
    setDrafts(prev => prev.map((d, i) => (i === index ? copedent.strings[index].openNote : d)))
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">Open Notes</label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {copedent.strings.map((s, i) => {
          const draft = drafts[i] ?? s.openNote
          const invalid = normalizeOrNull(draft) === null
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4 text-right">{s.number}</span>
              <input
                value={draft}
                aria-label={`String ${s.number} open note`}
                aria-invalid={invalid || undefined}
                title={invalid ? 'Enter a note with octave, e.g. F#4 or Bb3' : undefined}
                onChange={e => updateDraft(i, e.target.value)}
                onBlur={() => syncDraft(i)}
                className={`bg-gray-800 text-white border rounded px-2 py-1 w-16 text-sm ${
                  invalid ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
