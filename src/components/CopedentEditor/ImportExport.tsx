import { useState } from 'react'
import type { Copedent } from '../../types'

interface ImportExportProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
}

export function ImportExport({ copedent, onUpdate }: ImportExportProps) {
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const handleExport = () => {
    const json = JSON.stringify(copedent, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${copedent.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText)
      if (parsed.name && parsed.strings && Array.isArray(parsed.strings)) {
        const { id, ...updates } = parsed
        onUpdate(updates)
        setImportText('')
        setImportError('')
      } else {
        setImportError('Invalid copedent format')
      }
    } catch {
      setImportError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="px-3 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700"
        >
          Import
        </button>
      </div>
      <textarea
        value={importText}
        onChange={e => { setImportText(e.target.value); setImportError('') }}
        placeholder="Paste copedent JSON here to import..."
        className="w-full h-24 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-xs font-mono"
      />
      {importError && <p className="text-red-400 text-xs">{importError}</p>}
    </div>
  )
}
