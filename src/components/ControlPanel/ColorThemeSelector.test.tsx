import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ColorThemeSelector } from './ColorThemeSelector';

describe('ColorThemeSelector', () => {
  it('renders dropdown with current theme selected', () => {
    const { getByRole } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    const select = getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('chordTones');
  });

  it('calls onChange when theme is selected', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={onChange} />
    );
    fireEvent.change(getByRole('combobox'), { target: { value: 'rootFocus' } });
    expect(onChange).toHaveBeenCalledWith('rootFocus');
  });

  it('shows info popover on info button click', () => {
    const { getByLabelText, getByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    fireEvent.click(getByLabelText('Color theme info'));
    expect(getByText(/Root stands out in cyan/)).toBeTruthy();
  });

  it('dismisses popover on second click', () => {
    const { getByLabelText, queryByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    const btn = getByLabelText('Color theme info');
    fireEvent.click(btn);
    expect(queryByText(/Root stands out in cyan/)).toBeTruthy();
    fireEvent.click(btn);
    expect(queryByText(/Root stands out in cyan/)).toBeFalsy();
  });

  it('dismisses popover on Escape key', () => {
    const { getByLabelText, queryByText } = render(
      <ColorThemeSelector colorTheme="chordTones" onChange={vi.fn()} />
    );
    fireEvent.click(getByLabelText('Color theme info'));
    expect(queryByText(/Root stands out in cyan/)).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByText(/Root stands out in cyan/)).toBeFalsy();
  });
});
