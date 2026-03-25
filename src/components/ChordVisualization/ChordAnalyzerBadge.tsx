import { useState } from 'react';
import type { ChordDetectionResult } from '../../types/chordTypes';
import type { ColorTheme } from '../../types';
import { resolveChordColor } from '../../utils/chordFunctionColors';

interface ChordAnalyzerBadgeProps {
  detection: ChordDetectionResult | null;
  fret: number | null;
  hasEngagedControls: boolean;
  colorTheme?: ColorTheme;
}

export function ChordAnalyzerBadge({
  detection,
  fret,
  hasEngagedControls,
  colorTheme = 'chordTones',
}: ChordAnalyzerBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!detection) return null;

  const fretLabel = fret == null || fret === 0 ? 'OPEN STRINGS' : `CHORD AT FRET ${fret}`;
  const { primary, layers, alternatives } = detection;

  return (
    <div
      className="inline-block rounded-lg border-2 border-gray-700 bg-gray-950 px-3 py-2 cursor-pointer min-w-[160px]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">
        {fretLabel}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold" style={{ color: resolveChordColor('root', colorTheme) ?? '#00E5D0' }}>
          {primary.display}
        </span>
        {layers.extensions.length > 0 && (
          <span className="text-sm font-semibold flex gap-1.5">
            +
            {layers.extensions.map((e, i) => (
              <span key={i} style={{ color: resolveChordColor(e.split(' ')[0], colorTheme) ?? '#F4A261' }}>
                {e.split(' ')[0]}
              </span>
            ))}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {layers.extensions.length > 0 && (
            <div className="text-xs mb-1">
              <span className="text-gray-500">Extensions: </span>
              {layers.extensions.map((ext, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-gray-600">, </span>}
                  <span style={{ color: resolveChordColor(ext.split(' ')[0], colorTheme) ?? '#F4A261' }}>{ext}</span>
                </span>
              ))}
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
