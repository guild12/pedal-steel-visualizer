import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChordState } from './useChordState';

describe('useChordState', () => {
  it('initializes with no fret selected', () => {
    const { result } = renderHook(() => useChordState());
    expect(result.current.selectedFret).toBeNull();
  });

  it('selects and deselects a fret', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.selectFret(3));
    expect(result.current.selectedFret).toBe(3);
    act(() => result.current.selectFret(null));
    expect(result.current.selectedFret).toBeNull();
  });

  it('toggles same fret off', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.selectFret(3));
    act(() => result.current.selectFret(3));
    expect(result.current.selectedFret).toBeNull();
  });

  it('initializes chord finder as inactive', () => {
    const { result } = renderHook(() => useChordState());
    expect(result.current.chordFinder).toBeNull();
  });

  it('activates chord finder with a target chord', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateChordFinder('C', 'maj'));
    expect(result.current.chordFinder).not.toBeNull();
    expect(result.current.chordFinder!.active).toBe(true);
    expect(result.current.chordFinder!.targetChord).toEqual({ root: 'C', quality: 'maj' });
  });

  it('deactivates chord finder', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateChordFinder('C', 'maj'));
    act(() => result.current.deactivateChordFinder());
    expect(result.current.chordFinder).toBeNull();
  });

  it('activates chord transition', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    expect(result.current.chordTransition).not.toBeNull();
    expect(result.current.chordTransition!.chordA).toEqual({ root: 'E', quality: 'maj' });
    expect(result.current.chordTransition!.chordB).toEqual({ root: 'A', quality: 'maj' });
  });

  it('selects a transition result', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    act(() => result.current.selectTransitionResult(2));
    expect(result.current.chordTransition!.selectedResultIndex).toBe(2);
  });

  it('deactivates transition', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateTransition('E', 'maj', 'A', 'maj'));
    act(() => result.current.deactivateTransition());
    expect(result.current.chordTransition).toBeNull();
  });

  it('initializes move-to as inactive', () => {
    const { result } = renderHook(() => useChordState());
    expect(result.current.moveTo).toBeNull();
  });

  it('activates move-to with a target and clears other modes', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateChordFinder('C', 'maj'));
    act(() => result.current.activateMoveTo('A', 'maj'));
    expect(result.current.moveTo!.active).toBe(true);
    expect(result.current.moveTo!.targetChord).toEqual({ root: 'A', quality: 'maj' });
    expect(result.current.moveTo!.inspectedIndex).toBeNull();
    expect(result.current.chordFinder).toBeNull();
  });

  it('inspects a move result', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateMoveTo('A', 'maj'));
    act(() => result.current.inspectMoveResult(2));
    expect(result.current.moveTo!.inspectedIndex).toBe(2);
  });

  it('deactivates move-to', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.activateMoveTo('A', 'maj'));
    act(() => result.current.deactivateMoveTo());
    expect(result.current.moveTo).toBeNull();
  });
});

describe('setSelectedFret', () => {
  it('sets the fret without toggling on repeat', () => {
    const { result } = renderHook(() => useChordState());
    act(() => result.current.setSelectedFret(4));
    expect(result.current.selectedFret).toBe(4);
    act(() => result.current.setSelectedFret(4));
    expect(result.current.selectedFret).toBe(4); // does NOT toggle to null
    act(() => result.current.setSelectedFret(null));
    expect(result.current.selectedFret).toBeNull();
  });
});
