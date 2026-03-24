import type { Copedent } from '../../types'

interface GuitarConfigProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function GuitarConfig({ copedent, onUpdate }: GuitarConfigProps) {
  const updateName = (name: string) => onUpdate({ name })

  const addPedal = () => {
    const next = String.fromCharCode(65 + copedent.pedals.length)
    onUpdate({ pedals: [...copedent.pedals, next] })
  }

  const removePedal = (index: number) => {
    const removed = copedent.pedals[index]
    onUpdate({
      pedals: copedent.pedals.filter((_, i) => i !== index),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.filter(c => c.control !== removed),
      })),
    })
  }

  const renamePedal = (index: number, newName: string) => {
    const oldName = copedent.pedals[index]
    onUpdate({
      pedals: copedent.pedals.map((p, i) => i === index ? newName : p),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.map(c => c.control === oldName ? { ...c, control: newName } : c),
      })),
    })
  }

  const addLever = () => {
    const levers = ['LKL', 'LKR', 'RKL', 'RKR', 'RKR2']
    const next = levers[copedent.kneeLevers.length] ?? `KL${copedent.kneeLevers.length + 1}`
    onUpdate({ kneeLevers: [...copedent.kneeLevers, next] })
  }

  const removeLever = (index: number) => {
    const removed = copedent.kneeLevers[index]
    onUpdate({
      kneeLevers: copedent.kneeLevers.filter((_, i) => i !== index),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.filter(c => c.control !== removed),
      })),
    })
  }

  const renameLever = (index: number, newName: string) => {
    const oldName = copedent.kneeLevers[index]
    onUpdate({
      kneeLevers: copedent.kneeLevers.map((l, i) => i === index ? newName : l),
      strings: copedent.strings.map(s => ({
        ...s,
        changes: s.changes.map(c => c.control === oldName ? { ...c, control: newName } : c),
      })),
    })
  }

  const setStringCount = (count: number) => {
    const clamped = Math.max(1, Math.min(14, count))
    if (clamped === copedent.strings.length) return
    if (clamped > copedent.strings.length) {
      const newStrings = Array.from(
        { length: clamped - copedent.strings.length },
        (_, i) => ({
          number: copedent.strings.length + i + 1,
          openNote: 'E3',
          changes: [],
        })
      )
      onUpdate({ strings: [...copedent.strings, ...newStrings] })
    } else {
      onUpdate({ strings: copedent.strings.slice(0, clamped) })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <input
          value={copedent.name}
          onChange={e => updateName(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 w-full"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Strings ({copedent.strings.length})</label>
        <input
          type="number" min={1} max={14}
          value={copedent.strings.length}
          onChange={e => setStringCount(parseInt(e.target.value, 10))}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 w-20"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Pedals</label>
          <button onClick={addPedal} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {copedent.pedals.map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={p}
                onChange={e => renamePedal(i, e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm"
              />
              <button onClick={() => removePedal(i)} className="text-red-500 text-xs hover:text-red-400">x</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-gray-400">Knee Levers</label>
          <button onClick={addLever} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {copedent.kneeLevers.map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={l}
                onChange={e => renameLever(i, e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-16 text-sm"
              />
              <button onClick={() => removeLever(i)} className="text-red-500 text-xs hover:text-red-400">x</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
