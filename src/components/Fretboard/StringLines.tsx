import type { StringConfig } from '../../types'
import { getStringY, getStringThickness } from '../../utils/fretUtils'
import { getControlColor } from '../../utils/controlColors'

interface StringLinesProps {
  strings: StringConfig[];
  engagedControls: Set<string>;
  fretboardHeight: number;
  totalWidth: number;
}

const DASH = 12

export function StringLines({ strings, engagedControls, fretboardHeight, totalWidth }: StringLinesProps) {
  const lines: React.JSX.Element[] = []

  strings.forEach((s, i) => {
    const y = getStringY(i, strings.length, fretboardHeight)
    const thickness = getStringThickness(i, strings.length)
    const affecting = s.changes
      .map(c => c.control)
      .filter(control => engagedControls.has(control))

    if (affecting.length === 0) {
      lines.push(
        <line key={i} x1={0} y1={y} x2={totalWidth} y2={y}
          stroke="#9ca3af" strokeWidth={thickness} />
      )
    } else if (affecting.length === 1) {
      lines.push(
        <line key={i} x1={0} y1={y} x2={totalWidth} y2={y}
          stroke={getControlColor(affecting[0])} strokeWidth={thickness} />
      )
    } else {
      affecting.forEach((control, ci) => {
        lines.push(
          <line key={`${i}-${control}`} x1={0} y1={y} x2={totalWidth} y2={y}
            stroke={getControlColor(control)} strokeWidth={thickness}
            strokeDasharray={`${DASH},${DASH * (affecting.length - 1)}`}
            strokeDashoffset={ci * DASH} />
        )
      })
    }
  })

  return <g className="string-lines">{lines}</g>
}
