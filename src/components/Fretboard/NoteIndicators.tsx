import React from 'react'
import type { StringConfig, NoteDisplayMode } from '../../types'
import { calculateFretNote, getScaleDegree } from '../../utils/noteUtils'
import { getFretX, getStringY, TOTAL_FRETS } from '../../utils/fretUtils'
import { getChordFunctionColor } from '../../utils/chordFunctionColors'

interface NoteIndicatorsProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  chordNotes?: Map<string, string> | null;
}

export function NoteIndicators({
  strings, engagedControls, displayMode, selectedKey,
  fretboardWidth, fretboardHeight, leftMargin, chordNotes = null,
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

      let x: number
      if (fret === 0) {
        x = leftMargin - 2
      } else {
        const prevFretX = leftMargin + getFretX(fret - 1, fretboardWidth)
        const currFretX = leftMargin + getFretX(fret, fretboardWidth)
        x = (prevFretX + currFretX) / 2
      }

      const displayText = displayMode === 'scaleDegrees'
        ? getScaleDegree(activeNote, selectedKey)
        : activeNote

      let fillColor: string;
      let strokeColor: string;
      let textColor: string;

      if (chordNotes && chordNotes.size > 0) {
        const chordFunction = chordNotes.get(activeNote) ?? null;
        const functionColor = getChordFunctionColor(chordFunction);
        fillColor = chordFunction ? functionColor : '#1a1a2e';
        strokeColor = chordFunction ? functionColor : '#333';
        textColor = chordFunction ? '#fff' : '#555';
      } else {
        fillColor = isHighlighted ? '#e63946' : '#1f2937';
        strokeColor = isHighlighted ? '#e63946' : '#4b5563';
        textColor = '#fff';
      }

      indicators.push(
        <g key={`${si}-${fret}`} data-highlighted={isHighlighted ? 'true' : 'false'}>
          <circle
            cx={x} cy={y} r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={chordNotes && chordNotes.size > 0 && !chordNotes.get(activeNote) ? 0.3 : 1}
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
          {chordNotes && chordNotes.get(activeNote) && (
            <text
              x={x}
              y={y + radius + 8}
              textAnchor="middle"
              fill={getChordFunctionColor(chordNotes.get(activeNote) ?? null)}
              fontSize={6}
              opacity={0.7}
            >
              {chordNotes.get(activeNote)}
            </text>
          )}
        </g>
      )
    }
  })

  return <g className="note-indicators">{indicators}</g>
}
