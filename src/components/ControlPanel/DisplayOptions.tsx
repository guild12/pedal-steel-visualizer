import type { NoteDisplayMode } from '../../types'
import { NOTE_NAMES } from '../../utils/noteUtils'

interface DisplayOptionsProps {
  displayMode: NoteDisplayMode;
  selectedKey: string;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  onSelectedKeyChange: (key: string) => void;
  showExtensions: boolean;
  onToggleShowExtensions: () => void;
}

export function DisplayOptions({
  displayMode, selectedKey, onDisplayModeChange, onSelectedKeyChange,
  showExtensions, onToggleShowExtensions,
}: DisplayOptionsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Display:</span>
        <button
          onClick={() => onDisplayModeChange('letters')}
          className={`px-3 py-1 text-sm rounded ${
            displayMode === 'letters'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Letters
        </button>
        <button
          onClick={() => onDisplayModeChange('scaleDegrees')}
          className={`px-3 py-1 text-sm rounded ${
            displayMode === 'scaleDegrees'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Scale Degrees
        </button>
      </div>

      <button
        onClick={onToggleShowExtensions}
        title="Show or hide extension tones on the fretboard and badge"
        className={`px-3 py-1 text-sm rounded ${
          showExtensions
            ? 'bg-gray-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-gray-200'
        }`}
      >
        Extensions
      </button>

      {displayMode === 'scaleDegrees' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Key:</span>
          <select
            value={selectedKey}
            onChange={e => onSelectedKeyChange(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {NOTE_NAMES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
