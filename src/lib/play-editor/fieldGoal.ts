export function fieldGoalDistanceFromAbsoluteYardline(absoluteYardline: number): number {
  return Math.max(17, 100 - absoluteYardline + 17);
}
