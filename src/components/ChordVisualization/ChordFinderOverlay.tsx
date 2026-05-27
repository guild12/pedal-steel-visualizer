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
        // Notes sit ON the fret line (the bar position), so center the band
        // on that line — half a fret-width on each side — rather than spanning
        // the gap to the right of the dots.
        const center = getFretX(fret, fretboardWidth);
        const half = (getFretX(fret + 1, fretboardWidth) - getFretX(fret, fretboardWidth)) / 2;
        const x1 = Math.max(0, center - half);
        const x2 = center + half;
        const noPedals = voicing.engagedControls.length === 0;
        const opacity = noPedals ? 0.6 : 0.35;
        const dashArray = noPedals ? 'none' : '4,3';

        const labelWidth = 80;

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
                x={leftMargin + center - labelWidth / 2}
                y={fretboardHeight + 2}
                width={labelWidth}
                height={18}
                overflow="visible"
              >
                <div className="text-center">
                  <span className="text-[8px] text-red-500 bg-red-500/20 rounded px-1 whitespace-nowrap">
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
