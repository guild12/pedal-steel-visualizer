import type { Copedent, StringChange } from '../../types'

interface ChangesMatrixProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function ChangesMatrix({ copedent, onUpdate }: ChangesMatrixProps) {
  const allControls = [...copedent.pedals, ...copedent.kneeLevers]

  const getChange = (stringIndex: number, control: string): number => {
    const change = copedent.strings[stringIndex].changes.find(c => c.control === control)
    return change?.semitones ?? 0
  }

  const setChange = (stringIndex: number, control: string, semitones: number) => {
    const newStrings = copedent.strings.map((s, i) => {
      if (i !== stringIndex) return s
      const existingIdx = s.changes.findIndex(c => c.control === control)
      let newChanges: StringChange[]
      if (semitones === 0) {
        newChanges = s.changes.filter(c => c.control !== control)
      } else if (existingIdx >= 0) {
        newChanges = s.changes.map((c, ci) => ci === existingIdx ? { ...c, semitones } : c)
      } else {
        newChanges = [...s.changes, { control, semitones }]
      }
      return { ...s, changes: newChanges }
    })
    onUpdate({ strings: newStrings })
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">Changes Matrix</label>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-gray-500 text-left">Str</th>
              {allControls.map(c => (
                <th key={c} className="px-2 py-1 text-gray-400 text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copedent.strings.map((s, si) => (
              <tr key={si}>
                <td className="px-2 py-1 text-gray-500">{s.number}</td>
                {allControls.map(control => (
                  <td key={control} className="px-1 py-1">
                    <input
                      type="number"
                      value={getChange(si, control)}
                      onChange={e => setChange(si, control, parseInt(e.target.value, 10) || 0)}
                      className="bg-gray-800 text-white border border-gray-700 rounded px-1 py-0.5 w-12 text-center text-xs"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
