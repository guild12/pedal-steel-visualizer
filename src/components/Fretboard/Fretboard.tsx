import React, { useRef, useState, useEffect } from 'react'
import type { Copedent, NoteDisplayMode } from '../../types'
import type { VoicingResult } from '../../types/chordTypes'
import { TOTAL_FRETS } from '../../utils/fretUtils'
import { getFretX } from '../../utils/fretUtils'
import { FretLines } from './FretLines'
import { StringLines } from './StringLines'
import { NoteIndicators } from './NoteIndicators'
import { FretMarkers } from './FretMarkers'
import { ChordFinderOverlay } from '../ChordVisualization/ChordFinderOverlay'

interface FretboardProps {
  copedent: Copedent;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  // New chord props
  selectedFret?: number | null;
  onFretClick?: (fret: number) => void;
  chordNotes?: Map<string, string> | null;
  finderResults?: VoicingResult[] | null;
  finderTargetChord?: { root: string; quality: string } | null;
}

const LEFT_MARGIN = 50
const TOP_LABEL_HEIGHT = 20
const BOTTOM_LABEL_HEIGHT = 20
const STRING_LABEL_WIDTH = 30
const FRETBOARD_HEIGHT = 300
const MIN_FRET_WIDTH = 28

export function Fretboard({ copedent, engagedControls, displayMode, selectedKey, selectedFret = null, onFretClick, chordNotes = null, finderResults = null, finderTargetChord = null }: FretboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const fretboardWidth = Math.max(containerWidth - LEFT_MARGIN - STRING_LABEL_WIDTH, (TOTAL_FRETS + 1) * MIN_FRET_WIDTH)
  const totalSvgWidth = LEFT_MARGIN + fretboardWidth + 10
  const totalSvgHeight = TOP_LABEL_HEIGHT + FRETBOARD_HEIGHT + BOTTOM_LABEL_HEIGHT

  // Fret number labels — directly on fret lines (bar positions)
  const fretLabels: React.JSX.Element[] = []
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const x = LEFT_MARGIN + getFretX(fret, fretboardWidth)
    fretLabels.push(
      <text
        key={fret}
        x={x}
        y={TOP_LABEL_HEIGHT - 4}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={10}
        fontFamily="monospace"
      >
        {fret}
      </text>
    )
  }

  // String number labels
  const paddingY = 20
  const usableHeight = FRETBOARD_HEIGHT - paddingY * 2
  const spacing = usableHeight / (copedent.strings.length - 1)
  const stringLabels = copedent.strings.map((s, i) => {
    const sy = TOP_LABEL_HEIGHT + paddingY + i * spacing
    return (
      <text
        key={i}
        x={10}
        y={sy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#9ca3af"
        fontSize={11}
        fontFamily="monospace"
      >
        {s.number}
      </text>
    )
  })

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width="100%"
        height={totalSvgHeight}
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Fret numbers */}
        <g>{fretLabels}</g>

        {/* String numbers */}
        <g>{stringLabels}</g>

        {/* Fretboard area (offset by top label height) */}
        <g transform={`translate(0, ${TOP_LABEL_HEIGHT})`}>
          <FretMarkers
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
          />
          <FretLines
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
          />
          <StringLines
            totalStrings={copedent.strings.length}
            fretboardHeight={FRETBOARD_HEIGHT}
            totalWidth={totalSvgWidth}
          />
          <NoteIndicators
            strings={copedent.strings}
            engagedControls={engagedControls}
            displayMode={displayMode}
            selectedKey={selectedKey}
            fretboardWidth={fretboardWidth}
            fretboardHeight={FRETBOARD_HEIGHT}
            leftMargin={LEFT_MARGIN}
            chordNotes={chordNotes}
          />

          {/* Clickable fret regions — centered on each fret line */}
          {Array.from({ length: 13 }, (_, fret) => {
            const cx = LEFT_MARGIN + getFretX(fret, fretboardWidth);
            const halfGap = (fretboardWidth / TOTAL_FRETS) / 2;
            return (
              <rect
                key={`fret-click-${fret}`}
                x={cx - halfGap}
                y={0}
                width={halfGap * 2}
                height={FRETBOARD_HEIGHT}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onFretClick?.(fret)}
              />
            );
          })}

          {/* Selected fret highlight — vertical strip centered on fret line */}
          {selectedFret != null && (() => {
            const cx = LEFT_MARGIN + getFretX(selectedFret, fretboardWidth);
            const halfGap = (fretboardWidth / TOTAL_FRETS) / 2;
            return (
              <rect
                x={cx - halfGap}
                y={0}
                width={halfGap * 2}
                height={FRETBOARD_HEIGHT}
                rx={4}
                fill="#00E5D0"
                fillOpacity={0.08}
                stroke="#00E5D0"
                strokeOpacity={0.4}
                strokeWidth={2}
                strokeDasharray="4,3"
                pointerEvents="none"
              />
            );
          })()}

          {/* Chord finder overlay */}
          {finderResults && finderResults.length > 0 && finderTargetChord && (
            <ChordFinderOverlay
              results={finderResults}
              fretboardWidth={fretboardWidth}
              fretboardHeight={FRETBOARD_HEIGHT}
              leftMargin={LEFT_MARGIN}
              targetChord={finderTargetChord}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
