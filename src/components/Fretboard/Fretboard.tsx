import React, { useRef, useState, useEffect } from 'react'
import type { Copedent, NoteDisplayMode } from '../../types'
import { TOTAL_FRETS } from '../../utils/fretUtils'
import { getFretX } from '../../utils/fretUtils'
import { FretLines } from './FretLines'
import { StringLines } from './StringLines'
import { NoteIndicators } from './NoteIndicators'
import { FretMarkers } from './FretMarkers'

interface FretboardProps {
  copedent: Copedent;
  engagedControls: Set<string>;
  displayMode: NoteDisplayMode;
  selectedKey: string;
}

const LEFT_MARGIN = 50
const TOP_LABEL_HEIGHT = 20
const BOTTOM_LABEL_HEIGHT = 20
const STRING_LABEL_WIDTH = 30
const FRETBOARD_HEIGHT = 300
const MIN_FRET_WIDTH = 28

export function Fretboard({ copedent, engagedControls, displayMode, selectedKey }: FretboardProps) {
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

  // Fret number labels
  const fretLabels: React.JSX.Element[] = []
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    let x: number
    if (fret === 0) {
      x = LEFT_MARGIN - 2
    } else {
      const prevX = LEFT_MARGIN + getFretX(fret - 1, fretboardWidth)
      const currX = LEFT_MARGIN + getFretX(fret, fretboardWidth)
      x = (prevX + currX) / 2
    }
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
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        width={totalSvgWidth}
        height={totalSvgHeight}
        viewBox={`0 0 ${totalSvgWidth} ${totalSvgHeight}`}
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
          />
        </g>
      </svg>
    </div>
  )
}
