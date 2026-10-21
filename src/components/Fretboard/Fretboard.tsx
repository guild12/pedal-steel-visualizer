import React, { useRef, useState, useEffect } from 'react'
import type { Copedent, NoteDisplayMode, ColorTheme } from '../../types'
import type { VoicingResult, ScoredMove } from '../../types/chordTypes'
import { TOTAL_FRETS } from '../../utils/fretUtils'
import { getFretX } from '../../utils/fretUtils'
import { FretLines } from './FretLines'
import { StringLines } from './StringLines'
import { NoteIndicators } from './NoteIndicators'
import { FretMarkers } from './FretMarkers'
import { ChordFinderOverlay } from '../ChordVisualization/ChordFinderOverlay'
import { MoveToOverlay } from '../ChordVisualization/MoveToOverlay'

interface FretboardProps {
  copedent: Copedent;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
  // New chord props
  selectedFret?: number | null;
  onFretClick?: (fret: number) => void;
  chordNotes?: Map<string, { fn: string; isExtension: boolean }> | null;
  finderResults?: VoicingResult[] | null;
  finderTargetChord?: { root: string; quality: string } | null;
  moveResults?: ScoredMove[] | null;
  moveInspectedFret?: number | null;
  onMoveInspectFret?: (fret: number) => void;
  colorTheme?: ColorTheme;
}

const LEFT_MARGIN = 50
const TOP_LABEL_HEIGHT = 20
const BOTTOM_LABEL_HEIGHT = 20
const STRING_LABEL_WIDTH = 30
const MIN_FRETBOARD_HEIGHT = 300
const HEIGHT_PER_STRING = 32
const MIN_FRET_WIDTH = 40

export function Fretboard({ copedent, engagedControls, displayMode, selectedKey, selectedFret = null, onFretClick, chordNotes = null, finderResults = null, finderTargetChord = null, moveResults = null, moveInspectedFret = null, onMoveInspectFret, colorTheme = 'chordTones' }: FretboardProps) {
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

  // The parent <main> has native wheel/touchmove listeners that page between
  // snapshots on horizontal gestures. When the board overflows, let the
  // gesture scroll the board instead. Native listeners on an ancestor are not
  // stopped by React synthetic stopPropagation, so attach native ones here.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const stopIfOverflowing = (e: Event) => {
      if (el.scrollWidth > el.clientWidth) e.stopPropagation()
    }
    el.addEventListener('wheel', stopIfOverflowing, { passive: true })
    el.addEventListener('touchmove', stopIfOverflowing, { passive: true })
    return () => {
      el.removeEventListener('wheel', stopIfOverflowing)
      el.removeEventListener('touchmove', stopIfOverflowing)
    }
  }, [])

  const fretboardWidth = Math.max(containerWidth - LEFT_MARGIN - STRING_LABEL_WIDTH, (TOTAL_FRETS + 1) * MIN_FRET_WIDTH)
  const totalSvgWidth = LEFT_MARGIN + fretboardWidth + 10
  const fretboardHeight = Math.max(MIN_FRETBOARD_HEIGHT, copedent.strings.length * HEIGHT_PER_STRING)
  const totalSvgHeight = TOP_LABEL_HEIGHT + fretboardHeight + BOTTOM_LABEL_HEIGHT

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
  const usableHeight = fretboardHeight - paddingY * 2
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
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        width={totalSvgWidth}
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
            fretboardHeight={fretboardHeight}
            leftMargin={LEFT_MARGIN}
          />
          <FretLines
            fretboardWidth={fretboardWidth}
            fretboardHeight={fretboardHeight}
            leftMargin={LEFT_MARGIN}
          />
          <StringLines
            strings={copedent.strings}
            engagedControls={engagedControls}
            fretboardHeight={fretboardHeight}
            totalWidth={totalSvgWidth}
          />
          <NoteIndicators
            strings={copedent.strings}
            engagedControls={engagedControls}
            displayMode={displayMode}
            selectedKey={selectedKey}
            fretboardWidth={fretboardWidth}
            fretboardHeight={fretboardHeight}
            leftMargin={LEFT_MARGIN}
            chordNotes={chordNotes}
            colorTheme={colorTheme}
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
                height={fretboardHeight}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onFretClick?.(fret)}
              />
            );
          })}

          {/* Selected fret highlight — vertical strip centered on fret line */}
          {selectedFret != null && (() => {
            const cx = LEFT_MARGIN + getFretX(selectedFret, fretboardWidth);
            // Wide enough to clear the ~22px note circles with breathing room.
            const barWidth = Math.min((fretboardWidth / TOTAL_FRETS) * 0.95, 38);
            const r = barWidth / 2;
            const left = cx - r;
            const right = cx + r;
            // Tone-bar shape: domed (rounded) top, straight sides, flat bottom —
            // marks where the bar sits for this "Chord at Fret".
            const d = `M ${left} ${r} A ${r} ${r} 0 0 1 ${right} ${r} L ${right} ${fretboardHeight} L ${left} ${fretboardHeight} Z`;
            return (
              <path
                d={d}
                fill="#00E5D0"
                fillOpacity={0.1}
                stroke="#00E5D0"
                strokeOpacity={0.9}
                strokeWidth={2.5}
                strokeLinejoin="round"
                pointerEvents="none"
              />
            );
          })()}

          {/* Chord finder overlay */}
          {finderResults && finderResults.length > 0 && finderTargetChord && (
            <ChordFinderOverlay
              results={finderResults}
              fretboardWidth={fretboardWidth}
              fretboardHeight={fretboardHeight}
              leftMargin={LEFT_MARGIN}
              targetChord={finderTargetChord}
            />
          )}

          {/* Move-To overlay */}
          {moveResults && moveResults.length > 0 && (
            <MoveToOverlay
              moves={moveResults}
              inspectedFret={moveInspectedFret}
              fretboardWidth={fretboardWidth}
              fretboardHeight={fretboardHeight}
              leftMargin={LEFT_MARGIN}
              onInspectFret={(fret) => onMoveInspectFret?.(fret)}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
