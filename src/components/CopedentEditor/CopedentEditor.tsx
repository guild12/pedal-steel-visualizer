import type { Copedent } from '../../types'
import { GuitarConfig } from './GuitarConfig'
import { StringSetup } from './StringSetup'
import { ChangesMatrix } from './ChangesMatrix'
import { ImportExport } from './ImportExport'

interface CopedentEditorProps {
  copedent: Copedent;
  onUpdate: (updates: Partial<Copedent>) => void;
  onClose: () => void;
}

export function CopedentEditor({ copedent, onUpdate, onClose }: CopedentEditorProps) {
  return (
    <div className="border border-gray-700 rounded-lg p-6 space-y-6 bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Edit Copedent</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-gray-800 text-gray-400 rounded hover:text-white"
        >
          Close
        </button>
      </div>

      <GuitarConfig copedent={copedent} onUpdate={onUpdate} />
      <StringSetup copedent={copedent} onUpdate={onUpdate} />
      <ChangesMatrix copedent={copedent} onUpdate={onUpdate} />
      <ImportExport copedent={copedent} onUpdate={onUpdate} />
    </div>
  )
}
