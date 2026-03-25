import type { VoicingResult } from '../../types/chordTypes';
import { getFretX } from '../../utils/fretUtils';

interface ChordFinderOverlayProps {
  results: VoicingResult[];
  fretboardWidth: number;
  fretboardHeight: number;
  leftMargin: number;
  targetChord: { root: string; quality: string };
}

export function ChordFinderOverlay({
  results,
  fretboardWidth,
  fretboardHeight,
  leftMargin,
  targetChord,
}: ChordFinderOverlayProps) {
  const byFret = new Map<number, VoicingResult>();
  for (const r of results) {
    const existing = byFret.get(r.fret);
    if (!existing || r.score.combined > existing.score.combined) {
      byFret.set(r.fret, r);
    }
  }

  return (
    <g>
      {Array.from(byFret.entries()).map(([fret, voicing]) => {
        const x1 = fret === 0 ? 0 : getFretX(fret, fretboardWidth);
        const x2 = getFretX(fret + 1, fretboardWidth);
        const noPedals = voicing.engagedControls.length === 0;
        const opacity = noPedals ? 0.6 : 0.35;
        const dashArray = noPedals ? 'none' : '4,3';

        return (
          <g key={`finder-${fret}`}>
            <rect
              x={leftMargin + x1}
              y={0}
              width={x2 - x1}
              height={fretboardHeight}
              rx={4}
              fill="#00E5D0"
              fillOpacity={noPedals ? 0.08 : 0.04}
              stroke="#00E5D0"
              strokeOpacity={opacity}
              strokeWidth={noPedals ? 2 : 1.5}
              strokeDasharray={dashArray}
              pointerEvents="none"
            />
            {!noPedals && (
              <foreignObject
                x={leftMargin + x1}
                y={fretboardHeight + 2}
                width={x2 - x1}
                height={18}
              >
                <div className="text-center">
                  <span className="text-[8px] text-red-500 bg-red-500/20 rounded px-1">
                    + {voicing.engagedControls.join(', ')}
                  </span>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </g>
  );
}
