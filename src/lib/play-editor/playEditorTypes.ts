import type { PlayInput, PlayKind, TeamId, PlayerId } from '../football-engine';

export type PlayerPosition =
  | 'QB'
  | 'RB'
  | 'FB'
  | 'WR'
  | 'TE'
  | 'OL'
  | 'DL'
  | 'DE'
  | 'DT'
  | 'LB'
  | 'CB'
  | 'S'
  | 'K'
  | 'P'
  | 'LS'
  | 'KR'
  | 'PR'
  | 'ATH';

export type EditorPlayer = {
  id: PlayerId;
  teamId: TeamId;
  number: string;
  name: string;
  position: PlayerPosition | string;
};

export type PlayerRole =
  | 'passer'
  | 'runner'
  | 'receiver'
  | 'intendedReceiver'
  | 'tackler'
  | 'assistTackler'
  | 'sacker'
  | 'interceptor'
  | 'forcedFumble'
  | 'fumbleRecoverer'
  | 'kicker'
  | 'punter'
  | 'returner'
  | 'holder'
  | 'snapper'
  | 'blocker';

export type FieldKind =
  | 'number'
  | 'text'
  | 'boolean'
  | 'select'
  | 'player'
  | 'computed';

export type PlayFieldDefinition = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  defaultValue?: string | number | boolean;
  role?: PlayerRole;
  group: 'core' | 'offense' | 'defense' | 'specialTeams' | 'result' | 'penalty' | 'computed';
  options?: { label: string; value: string | number | boolean }[];
  showWhen?: (values: SmartPlayValues) => boolean;
  help?: string;
};

export type SmartPlayValues = Record<string, string | number | boolean | null | undefined>;

export type PlayTypeDefinition = {
  kind: PlayKind;
  label: string;
  category: 'Offense' | 'Passing' | 'Special Teams' | 'Turnover' | 'Administrative';
  shortcut: string;
  description: string;
  fields: PlayFieldDefinition[];
  buildPlayInput: (values: SmartPlayValues, context: SmartPlayContext) => PlayInput;
};

export type SmartPlayContext = {
  gameId: string;
  offenseTeamId: TeamId;
  defenseTeamId: TeamId;
  absoluteYardline: number;
  down: number;
  distance: number;
  quarter: string;
  clockStartSeconds: number;
  clockEndSeconds?: number;
};

export type FootballIQWarning = {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
};
