import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChordAnalyzerBadge } from './ChordAnalyzerBadge';

const mockDetection = {
  primary: { root: 'E', quality: 'maj', display: 'Emaj' },
  layers: { core: 'Emaj', extensions: ['9 (F#)'] },
  alternatives: [
    { root: 'C#', quality: 'min', display: 'C#min', score: 80 },
  ],
};

describe('ChordAnalyzerBadge', () => {
  it('renders chord name', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} />
    );
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('shows fret label', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={3} />
    );
    expect(getByText(/FRET 3/)).toBeTruthy();
  });

  it('shows OPEN STRINGS when fret is 0 or null', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={null} />
    );
    expect(getByText(/OPEN STRINGS/)).toBeTruthy();
  });

  it('clicking an extension calls onToggleExtension with its note', () => {
    const onToggleExtension = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} onToggleExtension={onToggleExtension} />
    );
    fireEvent.click(getByText('9'));
    expect(onToggleExtension).toHaveBeenCalledWith('F#');
  });

  it('greys a muted extension instead of coloring it', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} mutedExtensions={new Set(['F#'])} />
    );
    const labelSpan = getByText('9').closest('span[style]') as HTMLElement;
    expect(labelSpan.getAttribute('style')).toContain('rgb(107, 114, 128)'); // #6b7280
  });

  it('hides extensions entirely when showExtensions is false', () => {
    const { queryByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} showExtensions={false} />
    );
    expect(queryByText('9')).toBeNull();
  });

  it('renders chord name in root color (cyan) with default theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });

  it('renders chord name in cyan with rootFocus theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} colorTheme="rootFocus" />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });

  it('shows extensions when present', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} />
    );
    expect(getByText(/9/)).toBeTruthy();
  });

  it('shows alternatives always visible', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} />
    );
    expect(getByText('C#min')).toBeTruthy();
  });

  it('calls onChordOverride when alternative is clicked', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        onChordOverride={onOverride}
      />
    );
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith({
      root: 'C#', quality: 'min', display: 'C#min',
    });
  });

  it('displays override chord as primary when overrideChord is set', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    expect(getByText('C#min')).toBeTruthy();
  });

  it('shows (selected) label when override is active', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    expect(getByText('(selected)')).toBeTruthy();
  });

  it('shows original primary with (detected) label in Also list when overridden', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    expect(getByText('(detected)')).toBeTruthy();
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('shows original primary in Also list when override active', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('calls onChordOverride(null) when clicking promoted chord to revert', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={onOverride}
      />
    );
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith(null);
  });
});
