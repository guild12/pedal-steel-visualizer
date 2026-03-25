import { useState, useEffect, useMemo } from 'react'
import { Fretboard } from './components/Fretboard/Fretboard'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { CopedentManager } from './components/CopedentManager/CopedentManager'
import { CopedentEditor } from './components/CopedentEditor/CopedentEditor'
import { useCopedentState } from './hooks/useCopedentState'
import { useChordState } from './hooks/useChordState'
import { detectChord, getChordTones, getExtensions, noteNameToSemitone } from './utils/chordDetection'
import { findVoicings } from './utils/voicingSearch'
import { findTransitions } from './utils/transitionScoring'
import { calculateFretNote, NOTE_NAMES } from './utils/noteUtils'
import { INTERVAL_TO_FUNCTION } from './utils/chordDictionary'
import { ChordAnalyzerBadge } from './components/ChordVisualization/ChordAnalyzerBadge'
import { ChordPicker } from './components/ChordVisualization/ChordPicker'
import { TransitionPicker } from './components/ChordVisualization/TransitionPicker'
import { TransitionResults } from './components/ChordVisualization/TransitionResults'
import type { Copedent } from './types'
import type { ChordName } from './types/chordTypes'

function App() {
  const state = useCopedentState()
  const [editorOpen, setEditorOpen] = useState(false)

  const chordState = useChordState();

  // Override chord selection — when user clicks an alternative in the badge
  const [overrideChord, setOverrideChord] = useState<ChordName | null>(null);

  // Compute chord detection for current fret + controls
  const currentDetection = useMemo(() => {
    const fret = chordState.selectedFret ?? 0;
    const notes = state.activeCopedent.strings.map(s =>
      calculateFretNote(s.openNote, fret, s.changes, state.engagedControls)
    );
    return detectChord(notes);
  }, [chordState.selectedFret, state.engagedControls, state.activeCopedent]);

  // Auto-reset override when detection changes (fret change, pedal toggle, etc.)
  useEffect(() => {
    setOverrideChord(null);
  }, [currentDetection]);

  // Active chord: override wins over auto-detected
  const activeChord = overrideChord ?? currentDetection?.primary ?? null;

  // Compute extensions for override chord (reanalyze against current fretboard notes)
  const overrideExtensions = useMemo(() => {
    if (!overrideChord || chordState.selectedFret == null) return [];
    const fret = chordState.selectedFret ?? 0;
    const notes = state.activeCopedent.strings.map(s =>
      calculateFretNote(s.openNote, fret, s.changes, state.engagedControls)
    );
    const pitchClasses = [...new Set(notes.map(n => noteNameToSemitone(n)))];
    return getExtensions(overrideChord.root, overrideChord.quality, pitchClasses).extensions;
  }, [overrideChord, chordState.selectedFret, state.activeCopedent, state.engagedControls]);

  // Active extensions: override-computed or detected
  const activeExtensions = overrideChord ? overrideExtensions : (currentDetection?.layers.extensions ?? []);

  // Compute chord notes map for coloring (pitch class → function label)
  const chordNotesMap = useMemo(() => {
    if (!activeChord || chordState.selectedFret == null) return null;
    const map = new Map<string, string>();
    const rootSemitone = NOTE_NAMES.indexOf(activeChord.root as typeof NOTE_NAMES[number]);
    if (rootSemitone === -1) return null;

    // Core chord tones — compute relative interval from root to get function label
    const tones = getChordTones(activeChord.root, activeChord.quality);
    for (const semitone of tones) {
      const interval = (semitone - rootSemitone + 12) % 12;
      const fn = INTERVAL_TO_FUNCTION[interval];
      if (fn) {
        map.set(NOTE_NAMES[semitone % 12], fn);
      }
    }

    // Extension tones — from active extensions (works for both detected and override)
    for (const ext of activeExtensions) {
      const match = ext.match(/^([b#]?\d+)\s+\(([A-G]#?)\)/);
      if (match) {
        map.set(match[2], match[1]);
      }
    }

    return map;
  }, [activeChord, activeExtensions, chordState.selectedFret]);

  // Compute voicing search results for chord finder
  const finderResults = useMemo(() => {
    if (!chordState.chordFinder?.targetChord) return [];
    const { root, quality } = chordState.chordFinder.targetChord;
    return findVoicings(root, quality, state.activeCopedent);
  }, [chordState.chordFinder?.targetChord, state.activeCopedent]);

  // Compute transition results
  const transitionResults = useMemo(() => {
    if (!chordState.chordTransition?.chordA || !chordState.chordTransition?.chordB) return [];
    const { chordA, chordB } = chordState.chordTransition;
    return findTransitions(chordA.root, chordA.quality, chordB.root, chordB.quality, state.activeCopedent);
  }, [chordState.chordTransition?.chordA, chordState.chordTransition?.chordB, state.activeCopedent]);

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
        chordState.selectFret(null)
        chordState.deactivateChordFinder()
        chordState.deactivateTransition()
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
  }, [state.activeCopedent.pedals, state.toggleControl, state.clearAllControls, chordState])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between max-w-3xl">
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

      <main className="p-6 space-y-6 max-w-3xl">
        {/* Chord Picker (above fretboard) */}
        {chordState.chordFinder?.active && (
          <ChordPicker
            onChordSelect={(root, quality) => chordState.activateChordFinder(root, quality)}
            onClose={() => chordState.deactivateChordFinder()}
            selectedRoot={chordState.chordFinder.targetChord?.root}
            selectedQuality={chordState.chordFinder.targetChord?.quality}
          />
        )}

        {/* Transition Picker (above fretboard, replaces chord picker) */}
        {chordState.chordTransition?.active && (
          <TransitionPicker
            onTransitionSelect={(rA, qA, rB, qB) => chordState.activateTransition(rA, qA, rB, qB)}
            onClose={() => chordState.deactivateTransition()}
            chordA={chordState.chordTransition.chordA}
            chordB={chordState.chordTransition.chordB}
          />
        )}

        {/* Fretboard */}
        <Fretboard
          copedent={state.activeCopedent}
          engagedControls={state.engagedControls}
          displayMode={state.displayMode}
          selectedKey={state.selectedKey}
          selectedFret={chordState.selectedFret}
          onFretClick={(fret) => chordState.selectFret(fret)}
          chordNotes={chordNotesMap}
          finderResults={finderResults}
          finderTargetChord={chordState.chordFinder?.targetChord ?? null}
          colorTheme={state.colorTheme}
        />

        {/* Chord analyzer badge — below fretboard */}
        <ChordAnalyzerBadge
          detection={currentDetection}
          fret={chordState.selectedFret}
          hasEngagedControls={state.engagedControls.size > 0}
          colorTheme={state.colorTheme}
          overrideChord={overrideChord}
          onChordOverride={setOverrideChord}
          activeExtensions={activeExtensions}
        />

        {/* Transition Results (below fretboard) */}
        {chordState.chordTransition?.active && transitionResults.length > 0 && (
          <TransitionResults
            results={transitionResults}
            selectedIndex={chordState.chordTransition.selectedResultIndex}
            onSelect={(idx) => chordState.selectTransitionResult(idx)}
          />
        )}

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
          chordFinderActive={chordState.chordFinder?.active ?? false}
          transitionActive={chordState.chordTransition?.active ?? false}
          onChordFinderToggle={() => {
            if (chordState.chordFinder?.active) {
              chordState.deactivateChordFinder();
            } else {
              chordState.activateChordFinder('C', 'maj');
            }
          }}
          onTransitionToggle={() => {
            if (chordState.chordTransition?.active) {
              chordState.deactivateTransition();
            } else {
              chordState.activateTransition('E', 'maj', 'A', 'maj');
            }
          }}
          colorTheme={state.colorTheme}
          onColorThemeChange={state.setColorTheme}
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
