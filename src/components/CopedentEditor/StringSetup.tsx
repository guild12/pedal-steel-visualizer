import type { Copedent } from '../../types'
import { normalizeNoteName, parseNote } from '../../utils/noteUtils'

interface StringSetupProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function StringSetup({ copedent, onUpdate }: StringSetupProps) {
  const updateStringNote = (index: number, noteStr: string) => {
    let normalized = noteStr
    try {
      const parsed = parseNote(noteStr)
      normalized = normalizeNoteName(parsed.name) + parsed.octave
    } catch {
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
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
