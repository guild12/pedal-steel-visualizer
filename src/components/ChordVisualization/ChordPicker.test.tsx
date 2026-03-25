import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChordPicker } from './ChordPicker';

describe('ChordPicker', () => {
  it('renders root note buttons', () => {
    const { getByText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={vi.fn()} />
    );
    expect(getByText('C')).toBeTruthy();
    expect(getByText('F#')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });

  it('renders quality buttons', () => {
    const { getByText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={vi.fn()} />
    );
    expect(getByText('maj')).toBeTruthy();
    expect(getByText('min')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
  });

  it('calls onChordSelect when root + quality are picked', () => {
    const onSelect = vi.fn();
    const { getByText } = render(
      <ChordPicker onChordSelect={onSelect} onClose={vi.fn()} />
    );
    fireEvent.click(getByText('G'));
    fireEvent.click(getByText('min7'));
    expect(onSelect).toHaveBeenCalledWith('G', 'min7');
  });

  it('has a text input that parses chord names', () => {
    const onSelect = vi.fn();
    const { getByPlaceholderText } = render(
      <ChordPicker onChordSelect={onSelect} onClose={vi.fn()} />
    );
    const input = getByPlaceholderText(/Cmaj9/);
    fireEvent.change(input, { target: { value: 'Cmaj7' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('C', 'maj7');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <ChordPicker onChordSelect={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
