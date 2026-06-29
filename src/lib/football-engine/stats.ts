import type { PlayInput, PlayKind } from './types';

export const TEAM_TOTAL_PLAY_KINDS = new Set<PlayKind>([
  'RUSH',
  'SCRAMBLE',
  'SACK',
  'PASS_COMPLETE',
  'PASS_INCOMPLETE',
  'INTERCEPTION',
]);

export const DRIVE_PLAY_KINDS = TEAM_TOTAL_PLAY_KINDS;

export function countsAsTeamTotalPlay(play: Pick<PlayInput, 'kind'>): boolean {
  return TEAM_TOTAL_PLAY_KINDS.has(play.kind);
}

export function countsAsDrivePlay(play: Pick<PlayInput, 'kind'>): boolean {
  return DRIVE_PLAY_KINDS.has(play.kind);
}

export function isPassingPlay(play: Pick<PlayInput, 'kind'>): boolean {
  return play.kind === 'PASS_COMPLETE' || play.kind === 'PASS_INCOMPLETE' || play.kind === 'INTERCEPTION' || play.kind === 'SACK';
}

export function isRushingPlay(play: Pick<PlayInput, 'kind'>): boolean {
  return play.kind === 'RUSH' || play.kind === 'SCRAMBLE';
}

export function isSpecialTeamsPlay(play: Pick<PlayInput, 'kind'>): boolean {
  return ['PUNT', 'KICKOFF', 'FIELD_GOAL_GOOD', 'FIELD_GOAL_MISSED', 'PAT_GOOD', 'PAT_MISSED'].includes(play.kind);
}
