import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoveToPanel } from './MoveToPanel';
import type { ScoredMove } from '../../types/chordTypes';

function makeMove(fret: number, controls: string[], totalScore: number): ScoredMove {
  return {
    target: { fret, engagedControls: controls, notes: [], score: { completeness: 1, simplicity: 1, combined: 1 } },
    effort: { fretDistance: fret, controlChanges: controls.map(c => ({ control: c, action: 'press' as const })), commonTones: 0, totalScore },
  };
}

describe('MoveToPanel', () => {
  it('inspecting and committing the selected move calls onCommit with that target', () => {
    const moves = [makeMove(3, ['A'], 5), makeMove(8, ['B'], 30)];
    const onInspect = vi.fn();
    const onCommit = vi.fn();
    render(
      <MoveToPanel moves={moves} inspectedIndex={0} onInspect={onInspect} onCommit={onCommit} />
    );
    // Clicking a row inspects it.
    fireEvent.click(screen.getByText(/Fret 8/));
    expect(onInspect).toHaveBeenCalledWith(1);
    // The inspected row (index 0) shows a Move here button that commits its target.
    fireEvent.click(screen.getByRole('button', { name: /move here/i }));
    expect(onCommit).toHaveBeenCalledWith(moves[0].target);
  });

  it('renders an empty state when there are no moves', () => {
    render(<MoveToPanel moves={[]} inspectedIndex={null} onInspect={() => {}} onCommit={() => {}} />);
    expect(screen.getByText(/no positions/i)).toBeInTheDocument();
  });
});
