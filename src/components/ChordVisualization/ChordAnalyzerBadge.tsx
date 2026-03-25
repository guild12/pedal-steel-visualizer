import { useState } from 'react';
import type { ChordDetectionResult, ChordName } from '../../types/chordTypes';
import type { ColorTheme } from '../../types';
import { resolveChordColor } from '../../utils/chordFunctionColors';
import { getChordTones, noteNameToSemitone } from '../../utils/chordDetection';
import { INTERVAL_TO_FUNCTION } from '../../utils/chordDictionary';

interface ChordAnalyzerBadgeProps {
  detection: ChordDetectionResult | null;
  fret: number | null;
  hasEngagedControls: boolean;
  colorTheme?: ColorTheme;
  overrideChord?: ChordName | null;
  onChordOverride?: (chord: ChordName | null) => void;
  activeExtensions?: string[];
}

export function ChordAnalyzerBadge({
  detection,
  fret,
  hasEngagedControls,
  colorTheme = 'chordTones',
  overrideChord = null,
  onChordOverride,
  activeExtensions,
}: ChordAnalyzerBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!detection) return null;

  const fretLabel = fret == null || fret === 0 ? 'OPEN STRINGS' : `CHORD AT FRET ${fret}`;
  const { primary, layers, alternatives } = detection;

  // Determine displayed chord: override wins over auto-detected
  const displayedChord = overrideChord ?? primary;
  const isOverridden = overrideChord !== null;

  // Extensions: use activeExtensions from parent (handles both detected and override)
  const extensions = activeExtensions ?? layers.extensions;

  // Chord tone degrees (e.g., "1 3 5 7") with function labels for coloring
  const chordDegrees = (() => {
    if (!displayedChord.quality) return [];
    try {
      const tones = getChordTones(displayedChord.root, displayedChord.quality);
      const rootSemitone = noteNameToSemitone(displayedChord.root);
      return tones.map(s => {
        const interval = (s - rootSemitone + 12) % 12;
        const fn = INTERVAL_TO_FUNCTION[interval];
        if (!fn) return null;
        // Convert function label to degree display: 'root'→'1', '3rd'→'3', '5th'→'5', etc.
        const degree = fn === 'root' ? '1'
          : fn.replace(/(st|nd|rd|th)$/, '');
        return { degree, fn };
      }).filter(Boolean) as { degree: string; fn: string }[];
    } catch {
      return [];
    }
  })();

  // Build the "Also" list: swap original primary in when overridden
  const alsoList = isOverridden
    ? [
        { chord: primary, isDetected: true },
        ...alternatives
          .filter(alt => alt.display !== overrideChord.display)
          .slice(0, 2)
          .map(alt => ({ chord: alt as ChordName, isDetected: false })),
      ]
    : alternatives
        .slice(0, 3)
        .map(alt => ({ chord: alt as ChordName, isDetected: false }));

  return (
    <div
      className="inline-block rounded-lg border-2 border-gray-700 bg-gray-950 px-3 py-2 cursor-pointer min-w-[160px]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">
        {fretLabel}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-lg font-bold"
          style={{ color: resolveChordColor('root', colorTheme) ?? '#00E5D0' }}
          onClick={isOverridden && onChordOverride ? (e) => {
            e.stopPropagation();
            onChordOverride(null);
          } : undefined}
        >
          {displayedChord.display}
        </span>
        {isOverridden && (
          <span className="text-[10px] text-gray-500">(selected)</span>
        )}
        {extensions.length > 0 && (
          <span className="text-sm font-semibold flex gap-1.5">
            +
            {extensions.map((e, i) => (
              <span key={i} style={{ color: resolveChordColor(e.split(' ')[0], colorTheme, true) ?? '#F4A261' }}>
                {e.split(' ')[0]}
              </span>
            ))}
          </span>
        )}
      </div>

      {chordDegrees.length > 0 && (
        <div className="flex gap-2 mt-1">
          {chordDegrees.map((d, i) => (
            <span
              key={i}
              className="text-xs font-semibold"
              style={{ color: resolveChordColor(d.fn, colorTheme) ?? '#888' }}
            >
              {d.degree}
            </span>
          ))}
        </div>
      )}

      {alsoList.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-500">
          <div className="mb-1">Also:</div>
          {alsoList.map((item, i) => (
            <div
              key={i}
              className="text-gray-400 hover:text-gray-200 cursor-pointer py-0.5"
              onClick={(e) => {
                e.stopPropagation();
                if (onChordOverride) {
                  if (item.isDetected) {
                    onChordOverride(null);
                  } else {
                    const { root, quality, display } = item.chord;
                    onChordOverride({ root, quality, display });
                  }
                }
              }}
            >
              {item.chord.display}
              {item.isDetected && (
                <span className="text-gray-600 ml-1">(detected)</span>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded && extensions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <div className="text-xs mb-1">
            <span className="text-gray-500">Extensions: </span>
            {extensions.map((ext, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-600">, </span>}
                <span style={{ color: resolveChordColor(ext.split(' ')[0], colorTheme, true) ?? '#F4A261' }}>{ext}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
