import { useEffect, useRef, useState } from 'react'
import type { Copedent } from '../../types'
import { parseCopedentJson } from '../../utils/copedentImport'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleDelete = () => {
    const name = copedents.find(c => c.id === activeCopedentId)?.name ?? 'this copedent'
    if (window.confirm(`Delete "${name}"? (Built-in presets will reappear on reload.)`)) {
      onDelete(activeCopedentId)
    }
  }

  const [loadError, setLoadError] = useState('')

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = parseCopedentJson(String(reader.result ?? ''), crypto.randomUUID())
      if (result.ok) {
        setLoadError('')
        onLoadFromFile(result.copedent)
      } else {
        setLoadError(result.error)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be loaded again
    e.target.value = ''
  }

  const itemClass =
    'block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none'

  const choose = (action: () => void) => {
    setMenuOpen(false)
    action()
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
        onClick={onOpenEditor}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
      >
        Edit
      </button>

      <div ref={menuRef} className="relative">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Copedent actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 min-w-36 overflow-hidden rounded border border-gray-600 bg-gray-800 shadow-lg"
          >
            <button role="menuitem" type="button" onClick={() => choose(onCreateNew)} className={itemClass}>
              New
            </button>
            <button role="menuitem" type="button" onClick={() => choose(() => onDuplicate(activeCopedentId))} className={itemClass}>
              Duplicate
            </button>
            <button role="menuitem" type="button" onClick={() => choose(onSaveToFile)} className={`${itemClass} !text-cyan-400`}>
              Save
            </button>
            <button role="menuitem" type="button" onClick={() => choose(() => fileInputRef.current?.click())} className={`${itemClass} !text-cyan-400`}>
              Load
            </button>
            <button
              role="menuitem"
              type="button"
              onClick={() => choose(handleDelete)}
              title="Delete the selected copedent"
              className="block w-full text-left px-3 py-1.5 text-sm text-gray-400 border-t border-gray-700 hover:bg-red-900 hover:text-red-300 focus:bg-red-900 focus:text-red-300 focus:outline-none"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />
      {loadError && (
        <span role="alert" className="text-xs text-red-400 basis-full">{loadError}</span>
      )}
    </div>
  )
}
