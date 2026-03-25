import { useRef } from 'react'
import type { Copedent } from '../../types'

interface CopedentManagerProps {
  copedents: Copedent[];
  activeCopedentId: string;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onOpenEditor: () => void;
  onSaveToFile: () => void;
  onLoadFromFile: (copedent: Copedent) => void;
}

export function CopedentManager({
  copedents, activeCopedentId, onSelect, onDuplicate, onDelete, onCreateNew, onOpenEditor,
  onSaveToFile, onLoadFromFile,
}: CopedentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (parsed.name && Array.isArray(parsed.strings)) {
          const copedent: Copedent = {
            ...parsed,
            id: crypto.randomUUID(),
          }
          onLoadFromFile(copedent)
        }
      } catch {
        alert('Invalid copedent file')
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be loaded again
    e.target.value = ''
  }

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
        onClick={onSaveToFile}
        className="px-3 py-1.5 text-sm bg-gray-800 text-cyan-400 border border-gray-600 rounded hover:bg-gray-700"
      >
        Save
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-1.5 text-sm bg-gray-800 text-cyan-400 border border-gray-600 rounded hover:bg-gray-700"
      >
        Load
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />
      <button
        onClick={() => onDelete(activeCopedentId)}
        className="px-3 py-1.5 text-sm bg-red-900 text-red-300 border border-red-700 rounded hover:bg-red-800"
      >
        Delete
      </button>
    </div>
  )
}
