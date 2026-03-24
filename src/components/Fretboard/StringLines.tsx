import { getStringY, getStringThickness } from '../../utils/fretUtils'

interface StringLinesProps {
  totalStrings: number;
  fretboardHeight: number;
  totalWidth: number;
}

export function StringLines({ totalStrings, fretboardHeight, totalWidth }: StringLinesProps) {
  const lines = []
  for (let i = 0; i < totalStrings; i++) {
    const y = getStringY(i, totalStrings, fretboardHeight)
    lines.push(
      <line
        key={i}
        x1={0} y1={y} x2={totalWidth} y2={y}
        stroke="#9ca3af"
        strokeWidth={getStringThickness(i, totalStrings)}
      />
    )
  }
  return <g className="string-lines">{lines}</g>
}
