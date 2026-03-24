import { getFretX, FRET_MARKER_FRETS, DOUBLE_DOT_FRETS } from '../../utils/fretUtils'

interface FretMarkersProps {
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
}

export function FretMarkers({ fretboardWidth, fretboardHeight, leftMargin }: FretMarkersProps) {
  const markers: JSX.Element[] = []
  const midY = fretboardHeight / 2

  FRET_MARKER_FRETS.forEach(fret => {
    const prevX = leftMargin + getFretX(fret - 1, fretboardWidth)
    const currX = leftMargin + getFretX(fret, fretboardWidth)
    const centerX = (prevX + currX) / 2

    if (DOUBLE_DOT_FRETS.has(fret)) {
      markers.push(
        <circle key={`${fret}-a`} cx={centerX} cy={midY - 15} r={4} fill="#4b5563" />,
        <circle key={`${fret}-b`} cx={centerX} cy={midY + 15} r={4} fill="#4b5563" />,
      )
    } else {
      markers.push(
        <circle key={fret} cx={centerX} cy={midY} r={4} fill="#4b5563" />
      )
    }
  })

  return <g className="fret-markers">{markers}</g>
}
