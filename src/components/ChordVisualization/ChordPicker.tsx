import { useState } from 'react';
import { NOTE_NAMES } from '../../utils/noteUtils';
import { parseChordName } from '../../utils/chordDetection';

const COMMON_QUALITIES = [
  'maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug',
  '9', 'min9', '13', 'm7b5', 'dim7', 'sus2', 'sus4',
];

interface ChordPickerProps {
  onChordSelect: (root: string, quality: string) => void;
  onClose: () => void;
  selectedRoot?: string | null;
  selectedQuality?: string | null;
}

export function ChordPicker({
  onChordSelect,
  onClose,
  selectedRoot = null,
  selectedQuality = null,
}: ChordPickerProps) {
  const [root, setRoot] = useState<string | null>(selectedRoot);
  const [textInput, setTextInput] = useState('');

  const handleRootClick = (noteName: string) => {
    setRoot(noteName);
    if (selectedQuality) {
      onChordSelect(noteName, selectedQuality);
    }
  };

  const handleQualityClick = (quality: string) => {
    if (root) {
      onChordSelect(root, quality);
    }
  };

  const handleTextSubmit = () => {
    const parsed = parseChordName(textInput);
    if (parsed) {
      setRoot(parsed.root);
      onChordSelect(parsed.root, parsed.quality);
      setTextInput('');
    }
  };

  return (
    <div className="inline-flex items-start gap-3 bg-gray-900 border border-gray-700 rounded-xl p-3">
      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Root</div>
        <div className="grid grid-cols-6 gap-1">
          {NOTE_NAMES.map(name => (
            <button
              key={name}
              onClick={() => handleRootClick(name)}
              className={`px-2 py-1 text-xs rounded ${
                root === name
                  ? 'bg-cyan-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-16 bg-gray-700 self-center" />

      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Quality</div>
        <div className="flex flex-wrap gap-1 max-w-[280px]">
          {COMMON_QUALITIES.map(q => (
            <button
              key={q}
              onClick={() => handleQualityClick(q)}
              className={`px-2 py-1 text-xs rounded ${
                selectedQuality === q
                  ? 'bg-cyan-400 text-gray-950 font-bold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-16 bg-gray-700 self-center" />

      <div>
        <div className="text-gray-500 text-[9px] uppercase mb-1.5">Or type</div>
        <input
          type="text"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          placeholder="e.g. Cmaj9#11"
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 w-28"
        />
        <div className="text-gray-600 text-[9px] mt-1">Press Enter</div>
      </div>

      <button
        onClick={onClose}
        aria-label="Close"
        className="text-gray-500 hover:text-gray-300 text-lg self-start"
      >
        ×
      </button>
    </div>
  );
}
