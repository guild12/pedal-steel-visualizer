import type { ScoredMove } from '../../types/chordTypes';
import { getFretX, TOTAL_FRETS } from '../../utils/fretUtils';
import { bucketEase, easeColor } from '../../utils/moveToColors';
import { getControlColor } from '../../utils/controlColors';

interface MoveToOverlayProps {
  moves: ScoredMove[];
  inspectedFret: number | null;
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  onInspectFret: (fret: number) => void;
}

export function MoveToOverlay({
  moves,
  inspectedFret,
  fretboardWidth,
  fretboardHeight,
  leftMargin,
  onInspectFret,
}: MoveToOverlayProps) {
  // Keep only the easiest move per fret.
  const byFret = new Map<number, ScoredMove>();
  for (const m of moves) {
    const existing = byFret.get(m.target.fret);
    if (!existing || m.effort.totalScore < existing.effort.totalScore) {
      byFret.set(m.target.fret, m);
    }
  }

  const barWidth = Math.min((fretboardWidth / TOTAL_FRETS) * 0.95, 38);
  const r = barWidth / 2;

  return (
    <g>
      {Array.from(byFret.entries()).map(([fret, move]) => {
        const cx = leftMargin + getFretX(fret, fretboardWidth);
        const left = cx - r;
        const right = cx + r;
        const color = easeColor(bucketEase(move.effort.totalScore));
        const isInspected = inspectedFret === fret;
        const noBarMove = move.effort.fretDistance === 0;
        // Tone-bar shape: domed top, flat bottom (matches the selected-fret bar).
        const d = `M ${left} ${r} A ${r} ${r} 0 0 1 ${right} ${r} L ${right} ${fretboardHeight} L ${left} ${fretboardHeight} Z`;

        const presses = move.effort.controlChanges.filter(c => c.action === 'press').map(c => c.control);
        const releases = move.effort.controlChanges.filter(c => c.action === 'release').map(c => c.control);

        return (
          <g key={`move-${fret}`}>
            <path
              d={d}
              fill={color}
              fillOpacity={isInspected ? 0.22 : 0.1}
              stroke={color}
              strokeOpacity={isInspected ? 1 : 0.7}
              strokeWidth={isInspected ? 3 : 2}
              strokeLinejoin="round"
              strokeDasharray={noBarMove ? 'none' : '5,3'}
              className="cursor-pointer"
              onClick={() => onInspectFret(fret)}
            />
            <foreignObject
              x={cx - 45}
              y={fretboardHeight + 2}
              width={90}
              height={30}
              overflow="visible"
            >
              <div className="text-center leading-tight" style={{ pointerEvents: 'none' }}>
                {noBarMove && (
                  <div className="text-[7px] uppercase font-bold" style={{ color }}>no bar move</div>
                )}
                <div className="text-[8px] whitespace-nowrap">
                  {presses.map(c => (
                    <span key={`p-${c}`} style={{ color: getControlColor(c) }}>+{c} </span>
                  ))}
                  {releases.map(c => (
                    <span key={`r-${c}`} className="text-gray-500">-{c} </span>
                  ))}
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
