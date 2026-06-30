import { clampYardline, flipForNewPossession } from './field';

export type KickoffPlacementInput = {
  kickoffStartYardline: number;
  kickYards: number;
  returnYards?: number;
  touchback?: boolean;
  touchbackYardline: number;
  onsideKick?: boolean;
  kickingTeamRecovered?: boolean;
};

export type KickoffPlacementResult = {
  receivingTeamAbsoluteYardline: number;
  kickingTeamAbsoluteYardline: number;
  landingYardlineFromReceivingGoal: number;
  landingYardlineFromKickingGoal: number;
  description: string;
};

export type PuntPlacementInput = {
  lineOfScrimmageAbsoluteYardline: number;
  puntYards: number;
  returnYards?: number;
  touchback?: boolean;
  touchbackYardline: number;
};

export type ChangeOfPossessionReturnInput = {
  spotFromOriginalOffenseGoal: number;
  returnYards?: number;
};

/**
 * Kickoff geometry:
 *
 * A kickoff is entered from the kicking team's perspective:
 * - start 35 means K35
 * - kick 55 means ball lands at K90 = receiving team's 10
 * - return 10 means receiving team gets ball at its own 20
 *
 * Result for normal receiving team possession:
 * receiving absolute = 100 - (kickoffStart + kickYards) + returnYards
 */
export function calculateKickoffPlacement(input: KickoffPlacementInput): KickoffPlacementResult {
  const start = sanitizeYard(input.kickoffStartYardline, 35);
  const kick = sanitizeYard(input.kickYards, 0);
  const ret = sanitizeYard(input.returnYards ?? 0, 0);

  const landingFromKickingGoal = Math.max(0, Math.min(100, start + kick));
  const landingFromReceivingGoal = Math.max(0, Math.min(100, 100 - landingFromKickingGoal));

  if (input.touchback) {
    return {
      receivingTeamAbsoluteYardline: clampYardline(input.touchbackYardline),
      kickingTeamAbsoluteYardline: clampYardline(100 - input.touchbackYardline),
      landingYardlineFromReceivingGoal,
      landingYardlineFromKickingGoal,
      description: `Touchback to receiving ${input.touchbackYardline}`,
    };
  }

  if (input.onsideKick && input.kickingTeamRecovered) {
    const kickingTeamSpot = clampYardline(start + kick);
    return {
      receivingTeamAbsoluteYardline: flipForNewPossession(kickingTeamSpot),
      kickingTeamAbsoluteYardline: kickingTeamSpot,
      landingYardlineFromReceivingGoal,
      landingYardlineFromKickingGoal,
      description: `Onside recovered by kicking team at K${kickingTeamSpot}`,
    };
  }

  const receivingTeamSpot = clampYardline(landingFromReceivingGoal + ret);

  return {
    receivingTeamAbsoluteYardline: receivingTeamSpot,
    kickingTeamAbsoluteYardline: flipForNewPossession(receivingTeamSpot),
    landingYardlineFromReceivingGoal,
    landingYardlineFromKickingGoal,
    description: `Kickoff landed at R${landingFromReceivingGoal}, returned ${ret} to R${receivingTeamSpot}`,
  };
}

/**
 * Punt geometry:
 * The punt is entered from the punting/offense team's perspective.
 * After the punt, possession changes. The receiving team's new own-yardline is:
 * 100 - (LOS + puntYards) + returnYards
 */
export function calculatePuntPlacement(input: PuntPlacementInput): number {
  if (input.touchback) {
    return clampYardline(input.touchbackYardline);
  }

  const los = sanitizeYard(input.lineOfScrimmageAbsoluteYardline, 1);
  const punt = sanitizeYard(input.puntYards, 0);
  const ret = sanitizeYard(input.returnYards ?? 0, 0);

  const landingFromPuntingGoal = Math.max(0, Math.min(100, los + punt));
  return clampYardline(100 - landingFromPuntingGoal + ret);
}

/**
 * Interception/fumble return geometry from the original offense's perspective.
 *
 * If defense gets ball at original offense's 70 and returns 10 yards back toward
 * the original offense's goal, original-offense coordinate becomes 60.
 * New offense coordinate is 100 - 60 = 40.
 */
export function calculateChangeOfPossessionReturn(input: ChangeOfPossessionReturnInput): number {
  const spot = sanitizeYard(input.spotFromOriginalOffenseGoal, 50);
  const ret = sanitizeYard(input.returnYards ?? 0, 0);
  return clampYardline(100 - (spot - ret));
}

function sanitizeYard(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

export function kickoffExampleChecks(): Record<string, number> {
  return {
    'K35 + 55, return 10 => R20': calculateKickoffPlacement({
      kickoffStartYardline: 35,
      kickYards: 55,
      returnYards: 10,
      touchbackYardline: 25,
    }).receivingTeamAbsoluteYardline,
    'K35 + 65, touchback => R25': calculateKickoffPlacement({
      kickoffStartYardline: 35,
      kickYards: 65,
      returnYards: 0,
      touchback: true,
      touchbackYardline: 25,
    }).receivingTeamAbsoluteYardline,
  };
}
