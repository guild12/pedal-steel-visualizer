import { useState } from 'react';
import { ChordPicker } from './ChordPicker';

interface TransitionPickerProps {
  onTransitionSelect: (rootA: string, qualityA: string, rootB: string, qualityB: string) => void;
  onClose: () => void;
  chordA?: { root: string; quality: string } | null;
  chordB?: { root: string; quality: string } | null;
}

export function TransitionPicker({
  onTransitionSelect,
  onClose,
  chordA: initialA = null,
  chordB: initialB = null,
}: TransitionPickerProps) {
  const [chordA, setChordA] = useState(initialA);
  const [chordB, setChordB] = useState(initialB);
  const [editing, setEditing] = useState<'A' | 'B'>('A');

  const handleSelect = (root: string, quality: string) => {
    if (editing === 'A') {
      const newA = { root, quality };
      setChordA(newA);
      setEditing('B');
      if (chordB) {
        onTransitionSelect(root, quality, chordB.root, chordB.quality);
      }
    } else {
      const newB = { root, quality };
      setChordB(newB);
      if (chordA) {
        onTransitionSelect(chordA.root, chordA.quality, root, quality);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setEditing('A')}
          className={`rounded-lg border-2 px-4 py-2 min-w-[80px] text-center ${
            editing === 'A' ? 'border-cyan-400' : 'border-gray-700'
          }`}
        >
          <div className="text-cyan-400 text-[9px] uppercase">From</div>
          <div className="text-cyan-400 text-lg font-bold">
            {chordA ? `${chordA.root}${chordA.quality}` : '—'}
          </div>
        </button>

        <span className="text-gray-500 text-2xl">→</span>

        <button
          onClick={() => setEditing('B')}
          className={`rounded-lg border-2 px-4 py-2 min-w-[80px] text-center ${
            editing === 'B' ? 'border-red-500' : 'border-gray-700'
          }`}
        >
          <div className="text-red-500 text-[9px] uppercase">To</div>
          <div className="text-red-500 text-lg font-bold">
            {chordB ? `${chordB.root}${chordB.quality}` : '—'}
          </div>
        </button>

        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-500 hover:text-gray-300 text-lg ml-auto"
        >
          ×
        </button>
      </div>

      <ChordPicker
        onChordSelect={handleSelect}
        onClose={onClose}
        selectedRoot={editing === 'A' ? chordA?.root : chordB?.root}
        selectedQuality={editing === 'A' ? chordA?.quality : chordB?.quality}
      />
    </div>
  );
}
