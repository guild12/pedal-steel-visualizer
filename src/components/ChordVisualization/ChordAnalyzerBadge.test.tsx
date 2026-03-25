import { describe, it, expect } from 'vitest';
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
});
