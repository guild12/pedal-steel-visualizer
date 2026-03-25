import { describe, it, expect } from 'vitest';
import { resolveChordColor } from './chordFunctionColors';

describe('resolveChordColor', () => {
  describe('chordTones theme (2-color)', () => {
    const theme = 'chordTones' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 3rd (core tone)', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 5th (core tone)', () => {
      expect(resolveChordColor('5th', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 6th (core tone)', () => {
      expect(resolveChordColor('6th', theme)).toBe('#00E5D0');
    });

    it('returns cyan for b7 (core tone)', () => {
      expect(resolveChordColor('b7', theme)).toBe('#00E5D0');
    });

    it('returns cyan for 7th (core tone)', () => {
      expect(resolveChordColor('7th', theme)).toBe('#00E5D0');
    });

    it('returns orange for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#F4A261');
    });

    it('returns orange for #11 (extension)', () => {
      expect(resolveChordColor('#11', theme)).toBe('#F4A261');
    });

    it('returns orange for 13 (extension)', () => {
      expect(resolveChordColor('13', theme)).toBe('#F4A261');
    });

    it('returns null for null input (non-chord)', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('rootFocus theme (3-color)', () => {
    const theme = 'rootFocus' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns periwinkle for 3rd', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 5th', () => {
      expect(resolveChordColor('5th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 6th', () => {
      expect(resolveChordColor('6th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for 7th', () => {
      expect(resolveChordColor('7th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b3', () => {
      expect(resolveChordColor('b3', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b7', () => {
      expect(resolveChordColor('b7', theme)).toBe('#7B8CDE');
    });

    it('returns orange for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#F4A261');
    });

    it('returns null for null input', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('perFunction theme (5-color)', () => {
    const theme = 'perFunction' as const;

    it('returns cyan for root', () => {
      expect(resolveChordColor('root', theme)).toBe('#00E5D0');
    });

    it('returns red for 3rd', () => {
      expect(resolveChordColor('3rd', theme)).toBe('#e63946');
    });

    it('returns red for b3', () => {
      expect(resolveChordColor('b3', theme)).toBe('#e63946');
    });

    it('returns periwinkle for 5th', () => {
      expect(resolveChordColor('5th', theme)).toBe('#7B8CDE');
    });

    it('returns periwinkle for b5', () => {
      expect(resolveChordColor('b5', theme)).toBe('#7B8CDE');
    });

    it('returns orange for 7th', () => {
      expect(resolveChordColor('7th', theme)).toBe('#F4A261');
    });

    it('returns orange for 6th', () => {
      expect(resolveChordColor('6th', theme)).toBe('#F4A261');
    });

    it('returns purple for 9 (extension)', () => {
      expect(resolveChordColor('9', theme)).toBe('#9b59b6');
    });

    it('returns purple for #11 (extension)', () => {
      expect(resolveChordColor('#11', theme)).toBe('#9b59b6');
    });

    it('returns purple for 13 (extension)', () => {
      expect(resolveChordColor('13', theme)).toBe('#9b59b6');
    });

    it('returns null for null input', () => {
      expect(resolveChordColor(null, theme)).toBeNull();
    });
  });

  describe('unknown function labels', () => {
    it('falls back to extension color for unknown label in chordTones', () => {
      expect(resolveChordColor('unknown', 'chordTones')).toBe('#F4A261');
    });

    it('falls back to extension color for unknown label in rootFocus', () => {
      expect(resolveChordColor('unknown', 'rootFocus')).toBe('#F4A261');
    });

    it('falls back to purple for unknown label in perFunction', () => {
      expect(resolveChordColor('unknown', 'perFunction')).toBe('#9b59b6');
    });
  });
});
