import type { ChordDetectionResult } from '../../types/chordTypes';

interface ChordDetailPopoverProps {
  detection: ChordDetectionResult;
  x: number;
  y: number;
}

export function ChordDetailPopover({ detection, x, y }: ChordDetailPopoverProps) {
  const { layers, alternatives } = detection;

  return (
    <foreignObject x={x - 180} y={y} width={360} height={80}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-lg">
        <div className="flex items-baseline gap-3">
          <span className="text-gray-500">Core:</span>
          <span className="text-white font-bold">{layers.core}</span>
          {layers.extensions.length > 0 && (
            <>
              <span className="text-gray-500">Extensions:</span>
              <span className="text-indigo-400">{layers.extensions.join(', ')}</span>
            </>
          )}
        </div>
        {alternatives.length > 0 && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-gray-500">Also:</span>
            <span className="text-gray-400">
              {alternatives.slice(0, 3).map(a => a.display).join('  ·  ')}
            </span>
          </div>
        )}
      </div>
    </foreignObject>
  );
}
