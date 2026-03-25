import type { TransitionResult } from '../../types/chordTypes';

interface TransitionResultsProps {
  results: TransitionResult[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function TransitionResults({
  results,
  selectedIndex,
  onSelect,
}: TransitionResultsProps) {
  if (results.length === 0) {
    return <div className="text-gray-500 text-sm">No transitions found.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {results.map((result, i) => {
        const isSelected = selectedIndex === i;
        const { from, to, effort } = result;

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg text-left ${
              isSelected
                ? 'bg-gray-800 border border-cyan-400/40'
                : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-gray-500 text-sm font-mono w-6">#{i + 1}</div>

            <div className="text-center">
              <div className="text-cyan-400 text-xs">Fret {from.fret}</div>
              <div className="text-gray-500 text-[10px]">
                {from.engagedControls.length === 0
                  ? 'No pedals'
                  : from.engagedControls.join(' + ')}
              </div>
            </div>

            <span className="text-gray-600">→</span>

            <div className="text-center">
              <div className="text-red-500 text-xs">Fret {to.fret}</div>
              <div className="text-gray-500 text-[10px]">
                {to.engagedControls.length === 0
                  ? 'No pedals'
                  : to.engagedControls.join(' + ')}
              </div>
            </div>

            <div className="w-px h-8 bg-gray-700" />

            <div className="text-xs">
              <div className="text-gray-400">
                Bar: <span className={effort.fretDistance === 0 ? 'text-cyan-400' : 'text-orange-400'}>
                  {effort.fretDistance === 0 ? 'none' : `${effort.fretDistance} frets`}
                </span>
              </div>
              <div className="text-gray-400">
                Changes: <span className={effort.controlChanges.length === 0 ? 'text-cyan-400' : 'text-red-400'}>
                  {effort.controlChanges.length === 0
                    ? 'none'
                    : effort.controlChanges.map(c => `${c.action === 'press' ? '+' : '-'}${c.control}`).join(', ')}
                </span>
              </div>
              <div className="text-gray-400">
                Common: <span className="text-indigo-400">{effort.commonTones} strings</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
