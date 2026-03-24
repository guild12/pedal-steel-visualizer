import { getFretX, TOTAL_FRETS } from '../../utils/fretUtils'

interface FretLinesProps {
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function FretLines({ fretboardWidth, fretboardHeight, leftMargin }: FretLinesProps) {
  const lines = []
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const x = leftMargin + getFretX(fret, fretboardWidth)
    lines.push(
      <line
        key={fret}
        x1={x} y1={0} x2={x} y2={fretboardHeight}
        stroke={fret === 0 ? '#e5e7eb' : '#4b5563'}
        strokeWidth={fret === 0 ? 4 : 1}
      />
    )
  }
  return <g className="fret-lines">{lines}</g>
}
