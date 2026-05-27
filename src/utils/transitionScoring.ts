import type { Copedent } from '../types';
import type {
  TransitionResult,
  TransitionEffort,
  ControlChange,
  EffortPosition,
} from '../types/chordTypes';
import { findVoicings } from './voicingSearch';

export function findTransitions(
  rootA: string,
  qualityA: string,
  rootB: string,
  qualityB: string,
  copedent: Copedent,
  maxResults: number = 5,
): TransitionResult[] {
  const voicingsA = findVoicings(rootA, qualityA, copedent).slice(0, 20);
  const voicingsB = findVoicings(rootB, qualityB, copedent).slice(0, 20);

  const results: TransitionResult[] = [];

  for (const from of voicingsA) {
    for (const to of voicingsB) {
      const effort = scoreMove(from, to);
      results.push({ from, to, effort });
    }
  }

  results.sort((a, b) => a.effort.totalScore - b.effort.totalScore);
  return results.slice(0, maxResults);
}

/** Effort to move from one position/voicing to another. Lower totalScore = easier. */
export function scoreMove(from: EffortPosition, to: EffortPosition): TransitionEffort {
  const fretDistance = Math.abs(from.fret - to.fret);

  const fromControls = new Set(from.engagedControls);
  const toControls = new Set(to.engagedControls);
  const controlChanges: ControlChange[] = [];

  for (const c of toControls) {
    if (!fromControls.has(c)) {
      controlChanges.push({ control: c, action: 'press' });
    }
  }
  for (const c of fromControls) {
    if (!toControls.has(c)) {
      controlChanges.push({ control: c, action: 'release' });
    }
  }

  let commonTones = 0;
  for (let i = 0; i < from.notes.length && i < to.notes.length; i++) {
    if (from.notes[i].pitchClass === to.notes[i].pitchClass) {
      commonTones++;
    }
  }

  const totalScore =
    fretDistance * 10 +
    controlChanges.length * 5 -
    commonTones * 2;

  return { fretDistance, controlChanges, commonTones, totalScore };
}
