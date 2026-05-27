import { useState, useCallback } from 'react';
import type {
  ChordFinderState,
  ChordTransitionState,
  MoveToState,
} from '../types/chordTypes';

export function useChordState() {
  const [selectedFret, setSelectedFret] = useState<number | null>(null);
  const [chordFinder, setChordFinder] = useState<ChordFinderState | null>(null);
  const [chordTransition, setChordTransition] = useState<ChordTransitionState | null>(null);
  const [moveTo, setMoveTo] = useState<MoveToState | null>(null);

  const selectFret = useCallback((fret: number | null) => {
    setSelectedFret(prev => (prev === fret ? null : fret));
  }, []);

  const activateChordFinder = useCallback((root: string, quality: string) => {
    setChordFinder({
      active: true,
      targetChord: { root, quality },
      results: [],
    });
    setChordTransition(null);
    setMoveTo(null);
  }, []);

  const deactivateChordFinder = useCallback(() => {
    setChordFinder(null);
  }, []);

  const activateTransition = useCallback(
    (rootA: string, qualityA: string, rootB: string, qualityB: string) => {
      setChordTransition({
        active: true,
        chordA: { root: rootA, quality: qualityA },
        chordB: { root: rootB, quality: qualityB },
        results: [],
        selectedResultIndex: null,
      });
      setChordFinder(null);
      setMoveTo(null);
    },
    [],
  );

  const selectTransitionResult = useCallback((index: number) => {
    setChordTransition(prev =>
      prev ? { ...prev, selectedResultIndex: index } : null,
    );
  }, []);

  const deactivateTransition = useCallback(() => {
    setChordTransition(null);
  }, []);

  const activateMoveTo = useCallback((root: string, quality: string) => {
    setMoveTo({ active: true, targetChord: { root, quality }, inspectedIndex: null });
    setChordFinder(null);
    setChordTransition(null);
  }, []);

  const inspectMoveResult = useCallback((index: number) => {
    setMoveTo(prev => (prev ? { ...prev, inspectedIndex: index } : null));
  }, []);

  const deactivateMoveTo = useCallback(() => {
    setMoveTo(null);
  }, []);

  return {
    selectedFret,
    chordFinder,
    chordTransition,
    selectFret,
    activateChordFinder,
    deactivateChordFinder,
    activateTransition,
    selectTransitionResult,
    deactivateTransition,
    moveTo,
    activateMoveTo,
    inspectMoveResult,
    deactivateMoveTo,
  };
}
