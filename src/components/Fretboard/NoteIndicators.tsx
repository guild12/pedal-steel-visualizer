import React from 'react'
import type { StringConfig, NoteDisplayMode, ColorTheme } from '../../types'
import { calculateFretNote, getScaleDegree } from '../../utils/noteUtils'
import { getFretX, getStringY, TOTAL_FRETS } from '../../utils/fretUtils'
import { resolveChordColor } from '../../utils/chordFunctionColors'

interface NoteIndicatorsProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  chordNotes?: Map<string, { fn: string; isExtension: boolean }> | null;
  colorTheme?: ColorTheme;
}

export function NoteIndicators({
  strings, engagedControls, displayMode, selectedKey,
  fretboardWidth, fretboardHeight, leftMargin, chordNotes = null,
  colorTheme = 'chordTones',
}: NoteIndicatorsProps) {
  const indicators: React.JSX.Element[] = []
  const radius = 11
  const fontSize = 9

  strings.forEach((s, si) => {
    const y = getStringY(si, strings.length, fretboardHeight)

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const activeNote = calculateFretNote(s.openNote, fret, s.changes, engagedControls)
      const openFretNote = calculateFretNote(s.openNote, fret, s.changes, new Set())
      const isHighlighted = activeNote !== openFretNote

      // Notes sit directly on the fret line (bar position)
      const x = leftMargin + getFretX(fret, fretboardWidth)

      const displayText = displayMode === 'scaleDegrees'
        ? getScaleDegree(activeNote, selectedKey)
        : activeNote

      const chordInfo = chordNotes?.get(activeNote) ?? null;
      const chordFunction = chordInfo?.fn ?? null;
      const resolvedColor = resolveChordColor(chordFunction, colorTheme, chordInfo?.isExtension);
      let fillColor: string;
      let strokeColor: string;
      let textColor = '#fff';

      if (resolvedColor) {
        fillColor = resolvedColor;
        strokeColor = resolvedColor;
      } else {
        // Non-chord note, or no chord active
        fillColor = isHighlighted ? '#e63946' : '#1f2937';
        strokeColor = isHighlighted ? '#e63946' : '#4b5563';
      }

      indicators.push(
        <g key={`${si}-${fret}`} data-highlighted={isHighlighted ? 'true' : 'false'}>
          <circle
            cx={x} cy={y} r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={chordFunction ? 2 : 1}
          />
          <text
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize={fontSize}
            fontFamily="monospace"
          >
            {displayText}
          </text>
        </g>
      )
    }
  })

  return <g className="note-indicators">{indicators}</g>
}
