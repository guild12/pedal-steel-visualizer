import { useState, useEffect, useRef } from 'react';
import type { ColorTheme } from '../../types';

interface ColorThemeSelectorProps {
  colorTheme: ColorTheme;
  onChange: (theme: ColorTheme) => void;
}

const THEME_LABELS: Record<ColorTheme, string> = {
  chordTones: 'Chord Tones',
  rootFocus: 'Root Focus',
  perFunction: 'Per Function',
};

const THEME_DESCRIPTIONS: Record<ColorTheme, string> = {
  chordTones: 'Highlights notes in the chord vs. not. Core tones in cyan, extensions in orange.',
  rootFocus: 'Root stands out in cyan. Other chord tones in periwinkle, extensions in orange.',
  perFunction: 'Each chord degree gets its own color: root, 3rd, 5th, 7th, and extensions.',
};

export function ColorThemeSelector({ colorTheme, onChange }: ColorThemeSelectorProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [infoOpen]);

  return (
    <div className="flex items-center gap-2 relative" ref={popoverRef}>
      <span className="text-sm text-gray-400">Colors:</span>
      <select
        value={colorTheme}
        onChange={e => onChange(e.target.value as ColorTheme)}
        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
      >
        {(Object.keys(THEME_LABELS) as ColorTheme[]).map(t => (
          <option key={t} value={t}>{THEME_LABELS[t]}</option>
        ))}
      </select>
      <button
        aria-label="Color theme info"
        onClick={() => setInfoOpen(!infoOpen)}
        className="text-gray-500 hover:text-gray-300 text-sm leading-none"
      >
        (i)
      </button>

      {infoOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 w-72 shadow-lg">
          {(Object.keys(THEME_DESCRIPTIONS) as ColorTheme[]).map(t => (
            <div key={t} className="mb-2 last:mb-0">
              <div className="text-sm font-semibold text-white">{THEME_LABELS[t]}</div>
              <div className="text-xs text-gray-400">{THEME_DESCRIPTIONS[t]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
