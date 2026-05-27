// Ease coloring for Move-To ghost bars. These are intentionally a fixed,
// theme-independent green/amber/red triad: "ease" is a universal traffic-light
// semantic, not a note-function color, so it does not vary with colorTheme
// (which only governs note-dot coloring). Control-delta labels still use the
// per-control colors from controlColors.ts.
export type EaseBucket = 'easy' | 'medium' | 'hard';

export function bucketEase(totalScore: number): EaseBucket {
  if (totalScore <= 5) return 'easy';
  if (totalScore <= 20) return 'medium';
  return 'hard';
}

export function easeColor(bucket: EaseBucket): string {
  switch (bucket) {
    case 'easy': return '#7CFF6B';
    case 'medium': return '#FFB454';
    case 'hard': return '#FF6B6B';
  }
}
