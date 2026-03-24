import { Fretboard } from './components/Fretboard/Fretboard'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { useCopedentState } from './hooks/useCopedentState'

function App() {
  const state = useCopedentState()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Pedal Steel Visualizer</h1>
          <div className="flex items-center gap-2">
            <select
              value={state.activeCopedentId}
              onChange={e => state.setActiveCopedentId(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm"
            >
              {state.copedents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Fretboard
          copedent={state.activeCopedent}
          engagedControls={state.engagedControls}
          displayMode={state.displayMode}
          selectedKey={state.selectedKey}
        />

        <ControlPanel
          pedals={state.activeCopedent.pedals}
          kneeLevers={state.activeCopedent.kneeLevers}
          engagedControls={state.engagedControls}
          onToggleControl={state.toggleControl}
          onClearAll={state.clearAllControls}
          displayMode={state.displayMode}
          selectedKey={state.selectedKey}
          onDisplayModeChange={state.setDisplayMode}
          onSelectedKeyChange={state.setSelectedKey}
        />
      </main>
    </div>
  )
}

export default App
