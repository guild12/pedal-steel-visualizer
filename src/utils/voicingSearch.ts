import type { Copedent } from '../types';
import type { VoicingResult, VoicingNote, VoicingScore } from '../types/chordTypes';
import { calculateFretNoteWithOctave, calculateFretNote } from './noteUtils';
import { noteNameToSemitone, getChordTones } from './chordDetection';
import { generateValidCombinations, classifyKneeLevers } from './controlConstraints';
import { INTERVAL_TO_FUNCTION } from './chordDictionary';

// Inclusive: the fretboard draws frets 0-12, so the search must reach 12 too.
const MAX_FRET = 12;

export function findVoicings(
  root: string,
  quality: string,
  copedent: Copedent,
): VoicingResult[] {
  const chordTones = getChordTones(root, quality);
  const rootSemitone = noteNameToSemitone(root);
  const { left, right } = classifyKneeLevers(copedent.kneeLevers);
  const validCombos = generateValidCombinations(copedent.pedals, left, right);

  const results: VoicingResult[] = [];

  for (let fret = 0; fret <= MAX_FRET; fret++) {
    for (const combo of validCombos) {
      const engagedSet = new Set(combo);
      const notes: VoicingNote[] = [];
      const foundTones = new Set<number>();

      for (const stringConfig of copedent.strings) {
        const noteWithOctave = calculateFretNoteWithOctave(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          engagedSet,
        );
        const pitchClass = calculateFretNote(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          engagedSet,
        );
        const openPitchClass = calculateFretNote(
          stringConfig.openNote,
          fret,
          stringConfig.changes,
          new Set(),
        );

        const semitone = noteNameToSemitone(pitchClass);
        const isChordTone = chordTones.includes(semitone);
        const interval = (semitone - rootSemitone + 12) % 12;
        const chordFunction = isChordTone ? (INTERVAL_TO_FUNCTION[interval] ?? null) : null;

        const isAltered = pitchClass !== openPitchClass;
        let alteredBy: string | null = null;
        if (isAltered) {
          for (const change of stringConfig.changes) {
            if (engagedSet.has(change.control)) {
              alteredBy = change.control;
              break;
            }
          }
        }

        if (isChordTone) {
          foundTones.add(semitone);
        }

        notes.push({
          stringNumber: stringConfig.number,
          note: noteWithOctave,
          pitchClass,
          chordFunction,
          isAlteredByControl: isAltered,
          alteredBy,
        });
      }

      // Must have root + at least one defining tone (3rd or 7th)
      const hasRoot = foundTones.has(rootSemitone);
      const has3rd = foundTones.has((rootSemitone + 3) % 12) || foundTones.has((rootSemitone + 4) % 12);
      const has7th = foundTones.has((rootSemitone + 10) % 12) || foundTones.has((rootSemitone + 11) % 12);

      if (!hasRoot || (!has3rd && !has7th)) continue;

      const completeness = foundTones.size / chordTones.length;
      const maxControls = 4;
      const simplicity = 1 - (combo.length / maxControls);
      const combined = completeness * 0.6 + simplicity * 0.4;

      const score: VoicingScore = { completeness, simplicity, combined };
      results.push({ fret, engagedControls: [...combo], notes, score });
    }
  }

  results.sort((a, b) => b.score.combined - a.score.combined);
  return results;
}
