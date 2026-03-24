import React from 'react'
import type { StringConfig, NoteDisplayMode } from '../../types'
import { calculateFretNote, getScaleDegree } from '../../utils/noteUtils'
import { getFretX, getStringY, TOTAL_FRETS } from '../../utils/fretUtils'

interface NoteIndicatorsProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function NoteIndicators({
  strings, engagedControls, displayMode, selectedKey,
  fretboardWidth, fretboardHeight, leftMargin,
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

      indicators.push(
        <g key={`${si}-${fret}`} data-highlighted={isHighlighted ? 'true' : 'false'}>
          <circle
            cx={x} cy={y} r={radius}
            fill={isHighlighted ? '#e63946' : '#1f2937'}
            stroke={isHighlighted ? '#e63946' : '#4b5563'}
            strokeWidth={1}
          />
          <text
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
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
