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
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('shows fret label', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={3} hasEngagedControls={false} />
    );
    expect(getByText(/FRET 3/)).toBeTruthy();
  });

  it('shows OPEN STRINGS when fret is 0 or null', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={null} hasEngagedControls={false} />
    );
    expect(getByText(/OPEN STRINGS/)).toBeTruthy();
  });

  it('renders chord name in root color (cyan) with default theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={true} />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });

  it('renders chord name in cyan with rootFocus theme', () => {
    const { container } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={true} colorTheme="rootFocus" />
    );
    const chordName = container.querySelector('span[style]');
    expect(chordName?.getAttribute('style')).toContain('rgb(0, 229, 208)');
  });

  it('shows extensions when present', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(getByText(/9/)).toBeTruthy();
  });

  it('expands on click to show alternatives', () => {
    const { getByText, queryByText } = render(
      <ChordAnalyzerBadge detection={mockDetection} fret={0} hasEngagedControls={false} />
    );
    expect(queryByText('C#min')).toBeFalsy();
    fireEvent.click(getByText('Emaj'));
    expect(getByText('C#min')).toBeTruthy();
  });

  it('calls onChordOverride when alternative is clicked', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        onChordOverride={onOverride}
      />
    );
    fireEvent.click(getByText('Emaj'));
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith({
      root: 'C#', quality: 'min', display: 'C#min',
    });
  });

  it('displays override chord as primary when overrideChord is set', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    expect(getByText('C#min')).toBeTruthy();
  });

  it('shows (selected) label when override is active', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
      />
    );
    expect(getByText('(selected)')).toBeTruthy();
  });

  it('shows original primary with (detected) label in Also list when overridden', () => {
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    fireEvent.click(getByText('CHORD AT FRET 3'));
    expect(getByText('(detected)')).toBeTruthy();
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('badge expands when clicking non-chord-name area with override active', () => {
    const { getByText, queryByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={vi.fn()}
      />
    );
    expect(queryByText('Also:')).toBeFalsy();
    fireEvent.click(getByText('CHORD AT FRET 3'));
    expect(getByText('Emaj')).toBeTruthy();
  });

  it('calls onChordOverride(null) when clicking promoted chord to revert', () => {
    const onOverride = vi.fn();
    const { getByText } = render(
      <ChordAnalyzerBadge
        detection={mockDetection}
        fret={3}
        hasEngagedControls={true}
        overrideChord={{ root: 'C#', quality: 'min', display: 'C#min' }}
        onChordOverride={onOverride}
      />
    );
    fireEvent.click(getByText('C#min'));
    expect(onOverride).toHaveBeenCalledWith(null);
  });
});
