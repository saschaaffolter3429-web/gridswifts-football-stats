import type { RuleSetId } from './types';

export type RuleSet = {
  id: RuleSetId;
  label: string;
  fieldLength: number;
  endZoneLength: number;
  firstDownYards: number;
  downs: number;
  touchbackYardline: number;
  kickoffYardline: number;
  patKickPoints: number;
  twoPointPoints: number;
  touchdownPoints: number;
  fieldGoalPoints: number;
  safetyPoints: number;
};

export const RULE_SETS: Record<RuleSetId, RuleSet> = {
  IFAF: {
    id: 'IFAF',
    label: 'IFAF',
    fieldLength: 100,
    endZoneLength: 10,
    firstDownYards: 10,
    downs: 4,
    touchbackYardline: 25,
    kickoffYardline: 35,
    patKickPoints: 1,
    twoPointPoints: 2,
    touchdownPoints: 6,
    fieldGoalPoints: 3,
    safetyPoints: 2,
  },
  NCAA: {
    id: 'NCAA',
    label: 'NCAA',
    fieldLength: 100,
    endZoneLength: 10,
    firstDownYards: 10,
    downs: 4,
    touchbackYardline: 25,
    kickoffYardline: 35,
    patKickPoints: 1,
    twoPointPoints: 2,
    touchdownPoints: 6,
    fieldGoalPoints: 3,
    safetyPoints: 2,
  },
  NFL: {
    id: 'NFL',
    label: 'NFL',
    fieldLength: 100,
    endZoneLength: 10,
    firstDownYards: 10,
    downs: 4,
    touchbackYardline: 30,
    kickoffYardline: 35,
    patKickPoints: 1,
    twoPointPoints: 2,
    touchdownPoints: 6,
    fieldGoalPoints: 3,
    safetyPoints: 2,
  },
  HIGH_SCHOOL: {
    id: 'HIGH_SCHOOL',
    label: 'High School',
    fieldLength: 100,
    endZoneLength: 10,
    firstDownYards: 10,
    downs: 4,
    touchbackYardline: 20,
    kickoffYardline: 40,
    patKickPoints: 1,
    twoPointPoints: 2,
    touchdownPoints: 6,
    fieldGoalPoints: 3,
    safetyPoints: 2,
  },
};

export function getRuleSet(id: RuleSetId): RuleSet {
  return RULE_SETS[id];
}
