export function clampYardline(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
}

export function moveTowardOpponent(absoluteYardline: number, yards: number): number {
  return clampYardline(absoluteYardline + yards);
}

export function flipForNewPossession(absoluteYardline: number): number {
  return clampYardline(100 - absoluteYardline);
}

export function isTouchdownSpot(absoluteYardline: number, yards: number): boolean {
  return absoluteYardline + yards >= 100;
}

export function isSafetySpot(absoluteYardline: number, yards: number): boolean {
  return absoluteYardline + yards <= 0;
}

export function yardlineLabel(absoluteYardline: number, offenseAbbr = 'OWN', defenseAbbr = 'OPP'): string {
  if (absoluteYardline === 50) return '50';
  if (absoluteYardline < 50) return `${offenseAbbr} ${absoluteYardline}`;
  return `${defenseAbbr} ${100 - absoluteYardline}`;
}

export function yardsToGoal(absoluteYardline: number): number {
  return Math.max(1, 100 - absoluteYardline);
}

export function nextFirstDownLine(absoluteYardline: number, distance = 10): number {
  return Math.min(100, absoluteYardline + distance);
}

export function isGoalToGo(absoluteYardline: number, distance: number): boolean {
  return absoluteYardline + distance >= 100;
}
