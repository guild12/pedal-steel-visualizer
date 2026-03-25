import type { NoteDisplayMode, ColorTheme } from '../../types'
import { ToggleButton } from './ToggleButton'
import { DisplayOptions } from './DisplayOptions'
import { ColorThemeSelector } from './ColorThemeSelector'

interface ControlPanelProps {
  pedals: string[];
  kneeLevers: string[];
  engagedControls: Set<string>;
  onToggleControl: (control: string) => void;
  onClearAll: () => void;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  onDisplayModeChange: (mode: NoteDisplayMode) => void;
  onSelectedKeyChange: (key: string) => void;
  // New chord props
  onChordFinderToggle?: () => void;
  onTransitionToggle?: () => void;
  chordFinderActive?: boolean;
  transitionActive?: boolean;
  colorTheme?: ColorTheme;
  onColorThemeChange?: (theme: ColorTheme) => void;
}

export function ControlPanel({
  pedals, kneeLevers, engagedControls, onToggleControl, onClearAll,
  displayMode, selectedKey, onDisplayModeChange, onSelectedKeyChange,
  onChordFinderToggle, onTransitionToggle,
  chordFinderActive = false, transitionActive = false,
  colorTheme = 'chordTones', onColorThemeChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Pedals */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pedals</h3>
        <div className="flex flex-wrap gap-2">
          {pedals.map(p => (
            <ToggleButton
              key={p}
              label={p}
              engaged={engagedControls.has(p)}
              onClick={() => onToggleControl(p)}
            />
          ))}
        </div>
      </div>

      {/* Knee Levers */}
      {kneeLevers.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Knee Levers</h3>
          <div className="flex flex-wrap gap-2">
            {kneeLevers.map(l => (
              <ToggleButton
                key={l}
                label={l}
                engaged={engagedControls.has(l)}
                onClick={() => onToggleControl(l)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clear All + Display Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={onClearAll}
            className="px-3 py-1 text-sm bg-gray-800 text-gray-400 rounded hover:text-white hover:bg-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onChordFinderToggle}
            className={`px-3 py-1 rounded text-sm ${
              chordFinderActive ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Chord Finder
          </button>
          <button
            onClick={onTransitionToggle}
            className={`px-3 py-1 rounded text-sm ${
              transitionActive ? 'bg-cyan-400 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Transitions
          </button>
        </div>
        <DisplayOptions
          displayMode={displayMode}
          selectedKey={selectedKey}
          onDisplayModeChange={onDisplayModeChange}
          onSelectedKeyChange={onSelectedKeyChange}
        />
        {onColorThemeChange && (
          <ColorThemeSelector
            colorTheme={colorTheme}
            onChange={onColorThemeChange}
          />
        )}
      </div>
    </div>
  )
}
