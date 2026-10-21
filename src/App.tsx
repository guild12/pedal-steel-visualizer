import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Fretboard } from './components/Fretboard/Fretboard'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { CopedentManager } from './components/CopedentManager/CopedentManager'
import { CopedentEditor } from './components/CopedentEditor/CopedentEditor'
import { useCopedentState } from './hooks/useCopedentState'
import { useChordState } from './hooks/useChordState'
import { detectChord, getChordTones, getExtensions, noteNameToSemitone, parseExtension } from './utils/chordDetection'
import { findVoicings } from './utils/voicingSearch'
import { findTransitions, scoreMove } from './utils/transitionScoring'
import { calculateFretNote, NOTE_NAMES } from './utils/noteUtils'
import { INTERVAL_TO_FUNCTION } from './utils/chordDictionary'
import { ChordAnalyzerBadge } from './components/ChordVisualization/ChordAnalyzerBadge'
import { ChordPicker } from './components/ChordVisualization/ChordPicker'
import { TransitionPicker } from './components/ChordVisualization/TransitionPicker'
import { TransitionResults } from './components/ChordVisualization/TransitionResults'
import { MoveToPanel } from './components/ChordVisualization/MoveToPanel'
import { useSnapshotNavigation } from './hooks/useSnapshotNavigation'
import { useHorizontalSwipe } from './hooks/useHorizontalSwipe'
import { SnapshotPager } from './components/SnapshotPager/SnapshotPager'
import { HintStrip } from './components/HintStrip/HintStrip'
import type { Copedent } from './types'
import type { ChordName, ScoredMove, VoicingResult } from './types/chordTypes'

function App() {
  const state = useCopedentState()
  const [editorOpen, setEditorOpen] = useState(false)

  const chordState = useChordState();

  // Override chord selection — when user clicks an alternative in the badge
  const [overrideChord, setOverrideChord] = useState<ChordName | null>(null);

  // Notes the user has muted on the current chord (keyed by note name) — covers
  // both chord tones and extensions. Ephemeral: reset when the detected chord changes.
  const [mutedNotes, setMutedNotes] = useState<Set<string>>(new Set());

  const toggleMutedNote = (note: string) => {
    setMutedNotes(prev => {
      const next = new Set(prev);
      if (next.has(note)) next.delete(note);
      else next.add(note);
      return next;
    });
  };

  const { deactivateChordFinder, deactivateTransition, deactivateMoveTo } = chordState
  const resetTransientPanels = useCallback(() => {
    deactivateChordFinder()
    deactivateTransition()
    deactivateMoveTo()
  }, [deactivateChordFinder, deactivateTransition, deactivateMoveTo])

  // Snapshots: independent parallel configurations of the visualizer.
  const snapshotNav = useSnapshotNavigation({
    live: {
      activeCopedentId: state.activeCopedentId,
      engagedControls: state.engagedControls,
      selectedFret: chordState.selectedFret,
      displayMode: state.displayMode,
      selectedKey: state.selectedKey,
      colorTheme: state.colorTheme,
      showExtensions: state.showExtensions,
    },
    setters: {
      setActiveCopedentId: state.setActiveCopedentId,
      setControls: state.setControls,
      setSelectedFret: chordState.setSelectedFret,
      setDisplayMode: state.setDisplayMode,
      setSelectedKey: state.setSelectedKey,
      setColorTheme: state.setColorTheme,
      setShowExtensions: state.setShowExtensions,
    },
    onBeforeSwitch: resetTransientPanels,
  })

  const mainRef = useRef<HTMLElement>(null)
  useHorizontalSwipe(mainRef, { onSwipeLeft: snapshotNav.next, onSwipeRight: snapshotNav.prev })

  // Compute chord detection for current fret + controls
  const currentDetection = useMemo(() => {
    const fret = chordState.selectedFret ?? 0;
    const notes = state.activeCopedent.strings.map(s =>
      calculateFretNote(s.openNote, fret, s.changes, state.engagedControls)
    );
    return detectChord(notes);
  }, [chordState.selectedFret, state.engagedControls, state.activeCopedent]);

  // Auto-reset override + muted notes when detection changes (fret change,
  // pedal toggle, etc.). Done during render so there is no stale frame.
  const [detectionForOverride, setDetectionForOverride] = useState(currentDetection);
  if (detectionForOverride !== currentDetection) {
    setDetectionForOverride(currentDetection);
    setOverrideChord(null);
    setMutedNotes(new Set());
  }

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
  const activeExtensions = useMemo(
    () => (overrideChord ? overrideExtensions : (currentDetection?.layers.extensions ?? [])),
    [overrideChord, overrideExtensions, currentDetection],
  );

  // Compute chord notes map for coloring (pitch class → { fn, isExtension })
  const chordNotesMap = useMemo(() => {
    if (!activeChord || chordState.selectedFret == null) return null;
    const map = new Map<string, { fn: string; isExtension: boolean }>();
    const rootSemitone = NOTE_NAMES.indexOf(activeChord.root as typeof NOTE_NAMES[number]);
    if (rootSemitone === -1) return null;

    // Core chord tones — compute relative interval from root to get function label.
    // Skip any tone the user has muted on the badge.
    const tones = getChordTones(activeChord.root, activeChord.quality);
    for (const semitone of tones) {
      const interval = (semitone - rootSemitone + 12) % 12;
      const fn = INTERVAL_TO_FUNCTION[interval];
      const noteName = NOTE_NAMES[semitone % 12];
      if (fn && !mutedNotes.has(noteName)) {
        map.set(noteName, { fn, isExtension: false });
      }
    }

    // Extension tones — marked as extensions, unless extensions are globally
    // disabled or this specific one has been muted on the badge.
    if (state.showExtensions) {
      for (const ext of activeExtensions) {
        const parsed = parseExtension(ext);
        if (parsed && !mutedNotes.has(parsed.note)) {
          map.set(parsed.note, { fn: parsed.label, isExtension: true });
        }
      }
    }

    return map;
  }, [activeChord, activeExtensions, chordState.selectedFret, state.showExtensions, mutedNotes]);

  // Compute voicing search results for chord finder
  const finderTarget = chordState.chordFinder?.targetChord ?? null;
  const finderResults = useMemo(() => {
    if (!finderTarget) return [];
    return findVoicings(finderTarget.root, finderTarget.quality, state.activeCopedent);
  }, [finderTarget, state.activeCopedent]);

  // Compute transition results
  const { chordTransition } = chordState;
  const transitionResults = useMemo(() => {
    if (!chordTransition?.chordA || !chordTransition?.chordB) return [];
    const { chordA, chordB } = chordTransition;
    return findTransitions(chordA.root, chordA.quality, chordB.root, chordB.quality, state.activeCopedent);
  }, [chordTransition, state.activeCopedent]);

  // Compute ranked moves from the live position to the target chord
  const moveTarget = chordState.moveTo?.targetChord ?? null;
  const moveResults = useMemo<ScoredMove[]>(() => {
    if (!moveTarget) return [];
    const { root, quality } = moveTarget;
    const fret = chordState.selectedFret ?? 0;
    const source = {
      fret,
      engagedControls: [...state.engagedControls],
      notes: state.activeCopedent.strings.map(s => ({
        pitchClass: calculateFretNote(s.openNote, fret, s.changes, state.engagedControls),
      })),
    };
    // One move per fret (the easiest), so the panel rows and the per-fret
    // ghost bars in the overlay stay 1:1 and never disagree.
    const targets = findVoicings(root, quality, state.activeCopedent);
    const bestByFret = new Map<number, ScoredMove>();
    for (const target of targets) {
      const move: ScoredMove = { target, effort: scoreMove(source, target) };
      const existing = bestByFret.get(target.fret);
      if (!existing || move.effort.totalScore < existing.effort.totalScore) {
        bestByFret.set(target.fret, move);
      }
    }
    return [...bestByFret.values()].sort((a, b) => a.effort.totalScore - b.effort.totalScore);
  }, [moveTarget, chordState.selectedFret, state.engagedControls, state.activeCopedent]);

  // Fret currently inspected in Move-To (for overlay highlight)
  const moveInspectedFret =
    chordState.moveTo?.inspectedIndex != null
      ? moveResults[chordState.moveTo.inspectedIndex]?.target.fret ?? null
      : null;

  // Commit a move: drive bar + engaged controls to the chosen voicing
  const handleMoveCommit = (target: VoicingResult) => {
    state.setControls(target.engagedControls);
    if (chordState.selectedFret !== target.fret) {
      chordState.selectFret(target.fret);
    }
  };

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

  // Keyboard: Escape resets the board, digits toggle pedals. Both are ignored
  // while typing in a text field so the chord picker's input stays usable.
  const { toggleControl, clearAllControls } = state
  const { selectFret } = chordState
  const pedals = state.activeCopedent.pedals
  useEffect(() => {
    const isTyping = () => {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }
    const handler = (e: KeyboardEvent) => {
      if (isTyping()) return
      if (e.key === 'Escape') {
        clearAllControls()
        selectFret(null)
        resetTransientPanels()
        return
      }
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= pedals.length) {
        toggleControl(pedals[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pedals, toggleControl, clearAllControls, selectFret, resetTransientPanels])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 max-w-6xl">
          <h1 className="text-xl font-bold whitespace-nowrap">Pedal Steel Visualizer</h1>
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

      <main ref={mainRef} className="p-4 sm:p-6 space-y-6 max-w-6xl [overscroll-behavior-x:contain]">
        <SnapshotPager
          count={snapshotNav.snapshots.length}
          activeIndex={snapshotNav.activeIndex}
          onGo={snapshotNav.goTo}
          onPrev={snapshotNav.prev}
          onNext={snapshotNav.next}
          onAdd={snapshotNav.addClone}
          onDeleteCurrent={snapshotNav.deleteCurrent}
        />

        <HintStrip pedalCount={state.activeCopedent.pedals.length} />

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

        {/* Move-To Picker (above fretboard) */}
        {chordState.moveTo?.active && (
          <ChordPicker
            onChordSelect={(root, quality) => chordState.activateMoveTo(root, quality)}
            onClose={() => chordState.deactivateMoveTo()}
            selectedRoot={chordState.moveTo.targetChord?.root}
            selectedQuality={chordState.moveTo.targetChord?.quality}
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
          moveResults={chordState.moveTo?.active ? moveResults : null}
          moveInspectedFret={moveInspectedFret}
          onMoveInspectFret={(fret) => {
            const idx = moveResults.findIndex(m => m.target.fret === fret);
            if (idx >= 0) chordState.inspectMoveResult(idx);
          }}
          colorTheme={state.colorTheme}
        />

        {/* Chord analyzer badge — below fretboard */}
        <ChordAnalyzerBadge
          detection={currentDetection}
          fret={chordState.selectedFret}
          colorTheme={state.colorTheme}
          overrideChord={overrideChord}
          onChordOverride={setOverrideChord}
          activeExtensions={activeExtensions}
          showExtensions={state.showExtensions}
          mutedNotes={mutedNotes}
          onToggleNote={toggleMutedNote}
          pinnedChord={chordState.moveTo?.active ? chordState.moveTo.targetChord : null}
        />

        {/* Transition Results (below fretboard) */}
        {chordState.chordTransition?.active && transitionResults.length > 0 && (
          <TransitionResults
            results={transitionResults}
            selectedIndex={chordState.chordTransition.selectedResultIndex}
            onSelect={(idx) => chordState.selectTransitionResult(idx)}
          />
        )}

        {/* Move-To panel (below fretboard) */}
        {chordState.moveTo?.active && (
          <MoveToPanel
            moves={moveResults}
            inspectedIndex={chordState.moveTo.inspectedIndex}
            onInspect={(idx) => chordState.inspectMoveResult(idx)}
            onCommit={handleMoveCommit}
          />
        )}

        <ControlPanel
          pedals={state.activeCopedent.pedals}
          kneeLevers={state.activeCopedent.kneeLevers}
          engagedControls={state.engagedControls}
          onToggleControl={state.toggleControl}
          onClearAll={state.clearAllControls}
          showExtensions={state.showExtensions}
          onToggleShowExtensions={state.toggleShowExtensions}
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
          moveToActive={chordState.moveTo?.active ?? false}
          onMoveToToggle={() => {
            if (chordState.moveTo?.active) {
              chordState.deactivateMoveTo();
            } else {
              chordState.activateMoveTo('C', 'maj');
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
