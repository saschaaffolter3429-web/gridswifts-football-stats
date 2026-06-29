export type TeamId = string;
export type PlayerId = string;

export type RuleSetId = 'IFAF' | 'NCAA' | 'NFL' | 'HIGH_SCHOOL';

export type FieldSide = 'OWN' | 'OPP';

export type PlayKind =
  | 'RUSH'
  | 'PASS_COMPLETE'
  | 'PASS_INCOMPLETE'
  | 'SACK'
  | 'SCRAMBLE'
  | 'KNEEL'
  | 'SPIKE'
  | 'PUNT'
  | 'KICKOFF'
  | 'FIELD_GOAL_GOOD'
  | 'FIELD_GOAL_MISSED'
  | 'PAT_GOOD'
  | 'PAT_MISSED'
  | 'TWO_POINT_GOOD'
  | 'TWO_POINT_FAILED'
  | 'INTERCEPTION'
  | 'FUMBLE'
  | 'PENALTY'
  | 'TIMEOUT'
  | 'END_QUARTER';

export type GameClock = {
  quarter: string;
  secondsRemaining: number;
};

export type Score = Record<TeamId, number>;

export type BallSpot = {
  possessionTeamId: TeamId;
  absoluteYardline: number; // 1 = own goal line, 50 = midfield, 99 = opponent goal line
};

export type DownDistance = {
  down: 1 | 2 | 3 | 4;
  distance: number;
  goalToGo: boolean;
};

export type Drive = {
  id: string;
  teamId: TeamId;
  startPlayIndex: number;
  endPlayIndex?: number;
  startClock: GameClock;
  endClock?: GameClock;
  startAbsoluteYardline: number;
  endAbsoluteYardline?: number;
  offensivePlays: number;
  yards: number;
  durationSeconds: number;
  result: string;
};

export type GameState = {
  gameId: string;
  ruleSet: RuleSetId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  clock: GameClock;
  score: Score;
  possessionTeamId: TeamId;
  defenseTeamId: TeamId;
  absoluteYardline: number;
  down: 1 | 2 | 3 | 4;
  distance: number;
  goalToGo: boolean;
  seriesStartAbsoluteYardline: number;
  nextFirstDownAbsoluteYardline: number;
  currentDrive: Drive;
  completedDrives: Drive[];
  playIndex: number;
  messages: string[];
};

export type PlayerRefs = {
  passerId?: PlayerId;
  rusherId?: PlayerId;
  receiverId?: PlayerId;
  tacklerId?: PlayerId;
  interceptorId?: PlayerId;
  forcedFumbleId?: PlayerId;
  fumbleRecoveryId?: PlayerId;
  kickerId?: PlayerId;
  punterId?: PlayerId;
  returnerId?: PlayerId;
};

export type Penalty = {
  teamId: TeamId;
  name: string;
  yards: number;
  automaticFirstDown?: boolean;
  lossOfDown?: boolean;
  declined?: boolean;
};

export type PlayInput = {
  id: string;
  kind: PlayKind;
  clockStartSeconds?: number;
  clockEndSeconds?: number;
  yards?: number;
  airYards?: number;
  yac?: number;
  returnYards?: number;
  kickYards?: number;
  puntYards?: number;
  fieldGoalLength?: number;
  touchdown?: boolean;
  firstDown?: boolean;
  turnover?: boolean;
  safety?: boolean;
  touchback?: boolean;
  outOfBounds?: boolean;
  fairCatch?: boolean;
  onsideKick?: boolean;
  kickingTeamRecovered?: boolean;
  offenseRecoveredFumble?: boolean;
  players?: PlayerRefs;
  penalty?: Penalty;
  note?: string;
};

export type PlayResult = {
  previous: GameState;
  play: PlayInput;
  next: GameState;
  description: string;
  warnings: string[];
};

export type EngineError = {
  code: string;
  message: string;
};
