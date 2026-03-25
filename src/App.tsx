import { useState, useEffect } from 'react'
import { Fretboard } from './components/Fretboard/Fretboard'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { CopedentManager } from './components/CopedentManager/CopedentManager'
import { CopedentEditor } from './components/CopedentEditor/CopedentEditor'
import { useCopedentState } from './hooks/useCopedentState'
import type { Copedent } from './types'

function App() {
  const state = useCopedentState()
  const [editorOpen, setEditorOpen] = useState(false)

  const handleCreateNew = () => {
    const newCopedent: Copedent = {
      id: crypto.randomUUID(),
      name: 'New Copedent',
      pedals: ['A', 'B', 'C'],
      kneeLevers: ['LKL', 'LKR'],
      strings: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        openNote: 'E3',
        changes: [],
      })),
    }
    state.createCopedent(newCopedent)
    setEditorOpen(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        state.clearAllControls()
        return
      }
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= state.activeCopedent.pedals.length) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
        state.toggleControl(state.activeCopedent.pedals[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.activeCopedent.pedals, state.toggleControl, state.clearAllControls])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Pedal Steel Visualizer</h1>
          <CopedentManager
            copedents={state.copedents}
            activeCopedentId={state.activeCopedentId}
            onSelect={state.setActiveCopedentId}
            onDuplicate={state.duplicateCopedent}
            onDelete={state.deleteCopedent}
            onCreateNew={handleCreateNew}
            onOpenEditor={() => setEditorOpen(!editorOpen)}
            onSaveToFile={() => {
              const copedent = state.activeCopedent
              const json = JSON.stringify(copedent, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${copedent.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            onLoadFromFile={(copedent) => state.createCopedent(copedent)}
          />
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

        {editorOpen && (
          <CopedentEditor
            copedent={state.activeCopedent}
            onUpdate={(updates) => state.updateCopedent(state.activeCopedentId, updates)}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </main>
    </div>
  )
}

export default App
