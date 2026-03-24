import type { Copedent } from '../../types'

interface CopedentManagerProps {
  copedents: Copedent[];
  activeCopedentId: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onOpenEditor: () => void;
}

export function CopedentManager({
  copedents, activeCopedentId, onSelect, onDuplicate, onDelete, onCreateNew, onOpenEditor,
}: CopedentManagerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activeCopedentId}
        onChange={e => onSelect(e.target.value)}
        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm"
      >
        {copedents.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button
        onClick={onCreateNew}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        New
      </button>
      <button
        onClick={() => onDuplicate(activeCopedentId)}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        Duplicate
      </button>
      <button
        onClick={onOpenEditor}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(activeCopedentId)}
        className="px-3 py-1.5 text-sm bg-red-900 text-red-300 border border-red-700 rounded hover:bg-red-800"
      >
        Delete
      </button>
    </div>
  )
}
