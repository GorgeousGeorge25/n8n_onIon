/**
 * Grid layout calculator for node positioning
 */

// Layout constants
const SPACING_X = 300;
const SPACING_Y = 200;
const START_X = 100;
const START_Y = 100;

/**
 * Calculate grid position for a node based on its index.
 * Positions nodes in a 3-row grid pattern.
 *
 * @param index - Node index (0-based)
 * @returns [x, y] position tuple
 */
export function calculateGridPosition(index: number): [number, number] {
  const column = Math.floor(index / 3);
  const row = index % 3;

  const x = START_X + column * SPACING_X;
  const y = START_Y + row * SPACING_Y;

  return [x, y];
}
