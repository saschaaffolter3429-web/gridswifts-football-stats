import type { PlayKind } from '../football-engine';
import type { SmartPlayValues } from './playEditorTypes';

export type PlayTemplate = {
  id: string;
  label: string;
  kind: PlayKind;
  group: 'Run' | 'Pass' | 'Special Teams' | 'Turnover' | 'Clock';
  description: string;
  values: SmartPlayValues;
};

export const PLAY_TEMPLATES: PlayTemplate[] = [
  {
    id: 'run_left',
    label: 'Run Left',
    kind: 'RUSH',
    group: 'Run',
    description: 'Standard outside/zone run to the left.',
    values: { direction: 'left', yards: 0 },
  },
  {
    id: 'run_middle',
    label: 'Run Middle',
    kind: 'RUSH',
    group: 'Run',
    description: 'Inside run between the tackles.',
    values: { direction: 'middle', yards: 0 },
  },
  {
    id: 'run_right',
    label: 'Run Right',
    kind: 'RUSH',
    group: 'Run',
    description: 'Standard outside/zone run to the right.',
    values: { direction: 'right', yards: 0 },
  },
  {
    id: 'qb_sneak',
    label: 'QB Sneak',
    kind: 'RUSH',
    group: 'Run',
    description: 'Short-yardage quarterback sneak.',
    values: { direction: 'middle', yards: 1 },
  },
  {
    id: 'screen_pass',
    label: 'Screen Pass',
    kind: 'PASS_COMPLETE',
    group: 'Pass',
    description: 'Quick completed pass with most yards after catch.',
    values: { yards: 0, airYards: 0, yac: 0 },
  },
  {
    id: 'short_completion',
    label: 'Short Completion',
    kind: 'PASS_COMPLETE',
    group: 'Pass',
    description: 'Short pass completion.',
    values: { yards: 5, airYards: 3, yac: 2 },
  },
  {
    id: 'deep_completion',
    label: 'Deep Completion',
    kind: 'PASS_COMPLETE',
    group: 'Pass',
    description: 'Deep completed pass.',
    values: { yards: 25, airYards: 22, yac: 3 },
  },
  {
    id: 'drop',
    label: 'Drop',
    kind: 'PASS_INCOMPLETE',
    group: 'Pass',
    description: 'Incomplete pass caused by drop.',
    values: { reason: 'drop' },
  },
  {
    id: 'throwaway',
    label: 'Throw Away',
    kind: 'PASS_INCOMPLETE',
    group: 'Pass',
    description: 'Quarterback throws ball away.',
    values: { reason: 'throwaway' },
  },
  {
    id: 'sack_standard',
    label: 'Sack',
    kind: 'SACK',
    group: 'Pass',
    description: 'Standard sack for negative yardage.',
    values: { yards: -6 },
  },
  {
    id: 'punt_fair_catch',
    label: 'Punt Fair Catch',
    kind: 'PUNT',
    group: 'Special Teams',
    description: 'Punt with fair catch.',
    values: { puntYards: 40, fairCatch: true, hasReturn: false, returnYards: 0 },
  },
  {
    id: 'punt_return',
    label: 'Punt Return',
    kind: 'PUNT',
    group: 'Special Teams',
    description: 'Punt with return.',
    values: { puntYards: 40, hasReturn: true, returnYards: 0 },
  },
  {
    id: 'punt_touchback',
    label: 'Punt Touchback',
    kind: 'PUNT',
    group: 'Special Teams',
    description: 'Punt into endzone for touchback.',
    values: { puntYards: 50, touchback: true, hasReturn: false, returnYards: 0 },
  },
  {
    id: 'kickoff_touchback',
    label: 'Kickoff Touchback',
    kind: 'KICKOFF',
    group: 'Special Teams',
    description: 'Kickoff for touchback.',
    values: { kickYards: 75, touchback: true, returnYards: 0 },
  },
  {
    id: 'kickoff_return',
    label: 'Kickoff Return',
    kind: 'KICKOFF',
    group: 'Special Teams',
    description: 'Kickoff with return.',
    values: { kickYards: 60, touchback: false, returnYards: 20 },
  },
  {
    id: 'onside_recovered',
    label: 'Onside Recovered',
    kind: 'KICKOFF',
    group: 'Special Teams',
    description: 'Onside kick recovered by kicking team.',
    values: { kickYards: 10, onsideKick: true, kickingTeamRecovered: true },
  },
  {
    id: 'fg_good',
    label: 'FG Good',
    kind: 'FIELD_GOAL_GOOD',
    group: 'Special Teams',
    description: 'Field goal attempt good.',
    values: { good: true },
  },
  {
    id: 'fg_missed',
    label: 'FG Missed',
    kind: 'FIELD_GOAL_GOOD',
    group: 'Special Teams',
    description: 'Field goal attempt missed.',
    values: { good: false },
  },
  {
    id: 'interception',
    label: 'Interception',
    kind: 'INTERCEPTION',
    group: 'Turnover',
    description: 'Pass intercepted with no return by default.',
    values: { yards: 0, returnYards: 0 },
  },
  {
    id: 'pick_six',
    label: 'Pick Six',
    kind: 'INTERCEPTION',
    group: 'Turnover',
    description: 'Interception returned for touchdown.',
    values: { yards: 0, returnYards: 20, touchdown: true },
  },
  {
    id: 'fumble_lost',
    label: 'Fumble Lost',
    kind: 'FUMBLE',
    group: 'Turnover',
    description: 'Fumble recovered by defense.',
    values: { yards: 0, offenseRecoveredFumble: false, returnYards: 0 },
  },
  {
    id: 'fumble_offense_recovery',
    label: 'Fumble Offense Recovery',
    kind: 'FUMBLE',
    group: 'Turnover',
    description: 'Fumble recovered by offense, drive continues.',
    values: { yards: 0, offenseRecoveredFumble: true },
  },
];

export function templatesForKind(kind: PlayKind | string): PlayTemplate[] {
  return PLAY_TEMPLATES.filter((template) => template.kind === kind);
}

export function templatesByGroup(): Record<string, PlayTemplate[]> {
  return PLAY_TEMPLATES.reduce<Record<string, PlayTemplate[]>>((acc, template) => {
    acc[template.group] = acc[template.group] ?? [];
    acc[template.group].push(template);
    return acc;
  }, {});
}
