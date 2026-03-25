/**
 * Generate all physically valid pedal/lever combinations.
 *
 * Constraints:
 * - Pedals: at most 2, and they must be adjacent in the pedals array
 * - Left knee levers: at most 1
 * - Right knee levers: at most 1
 */
export function generateValidCombinations(
  pedals: string[],
  leftKneeLevers: string[],
  rightKneeLevers: string[],
): string[][] {
  // Generate valid pedal groups: none, singles, adjacent pairs
  const pedalGroups: string[][] = [[]];
  for (let i = 0; i < pedals.length; i++) {
    pedalGroups.push([pedals[i]]);
    if (i + 1 < pedals.length) {
      pedalGroups.push([pedals[i], pedals[i + 1]]);
    }
  }

  // Generate valid left knee lever options: none or single
  const leftOptions: string[][] = [[]];
  for (const lk of leftKneeLevers) {
    leftOptions.push([lk]);
  }

  // Generate valid right knee lever options: none or single
  const rightOptions: string[][] = [[]];
  for (const rk of rightKneeLevers) {
    rightOptions.push([rk]);
  }

  // Cross-product all groups
  const combinations: string[][] = [];
  for (const pg of pedalGroups) {
    for (const lk of leftOptions) {
      for (const rk of rightOptions) {
        combinations.push([...pg, ...lk, ...rk]);
      }
    }
  }

  return combinations;
}

/**
 * Classify a copedent's knee levers into left and right groups.
 * Convention: levers starting with 'L' are left, 'R' are right.
 */
export function classifyKneeLevers(kneeLevers: string[]): {
  left: string[];
  right: string[];
} {
  const left: string[] = [];
  const right: string[] = [];
  for (const lever of kneeLevers) {
    if (lever.startsWith('L')) {
      left.push(lever);
    } else {
      right.push(lever);
    }
  }
  return { left, right };
}
