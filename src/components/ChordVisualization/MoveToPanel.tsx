import type { ScoredMove, VoicingResult } from '../../types/chordTypes';
import { bucketEase, easeColor } from '../../utils/moveToColors';

interface MoveToPanelProps {
  moves: ScoredMove[];
  inspectedIndex: number | null;
  onInspect: (index: number) => void;
  onCommit: (target: VoicingResult) => void;
}

export function MoveToPanel({ moves, inspectedIndex, onInspect, onCommit }: MoveToPanelProps) {
  if (moves.length === 0) {
    return <div className="text-gray-500 text-sm">No positions found for that chord.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {moves.map((move, i) => {
        const isInspected = inspectedIndex === i;
        const { target, effort } = move;
        const color = easeColor(bucketEase(effort.totalScore));
        const presses = effort.controlChanges.filter(c => c.action === 'press').map(c => `+${c.control}`);
        const releases = effort.controlChanges.filter(c => c.action === 'release').map(c => `-${c.control}`);
        const changeText = [...presses, ...releases].join(', ') || 'no pedal change';

        return (
          <div
            key={i}
            onClick={() => onInspect(i)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
              isInspected ? 'bg-gray-800 border' : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
            }`}
            style={isInspected ? { borderColor: color } : undefined}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <div className="text-sm font-mono" style={{ color }}>Fret {target.fret}</div>
            <div className="text-xs text-gray-400 flex-1">
              {effort.fretDistance === 0 ? 'no bar move' : `slide ${effort.fretDistance}`} · {changeText}
            </div>
            <div className="text-[10px] text-indigo-400">{effort.commonTones} held</div>
            {isInspected && (
              <button
                onClick={(e) => { e.stopPropagation(); onCommit(target); }}
                className="px-3 py-1 text-xs rounded font-bold text-gray-950"
                style={{ backgroundColor: color }}
              >
                Move here
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
