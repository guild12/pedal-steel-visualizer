import { useState } from 'react';
import type { ChordDetectionResult } from '../../types/chordTypes';

interface ChordAnalyzerBadgeProps {
  detection: ChordDetectionResult | null;
  fret: number | null;
  hasEngagedControls: boolean;
}

export function ChordAnalyzerBadge({
  detection,
  fret,
  hasEngagedControls,
}: ChordAnalyzerBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!detection) return null;

  const borderColor = hasEngagedControls ? 'border-red-500' : 'border-cyan-400';
  const fretLabel = fret == null || fret === 0 ? 'OPEN STRINGS' : `CHORD AT FRET ${fret}`;
  const { primary, layers, alternatives } = detection;

  return (
    <div
      className={`absolute top-2 right-2 rounded-lg border-2 ${borderColor} bg-gray-950 px-3 py-2 cursor-pointer z-10 min-w-[160px]`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">
        {fretLabel}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${hasEngagedControls ? 'text-red-500' : 'text-cyan-400'}`}>
          {primary.display}
        </span>
        {layers.extensions.length > 0 && (
          <span className="text-sm text-indigo-400">
            + {layers.extensions.map(e => e.split(' ')[0]).join(', ')}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {layers.extensions.length > 0 && (
            <div className="text-xs text-gray-400 mb-1">
              Extensions: {layers.extensions.join(', ')}
            </div>
          )}
          {alternatives.length > 0 && (
            <div className="text-xs text-gray-500">
              <div className="mb-1">Also:</div>
              {alternatives.slice(0, 3).map((alt, i) => (
                <div key={i} className="text-gray-400">{alt.display}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
