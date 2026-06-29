import type { PlayInput } from '../football-engine';
import { fieldGoalDistanceFromAbsoluteYardline } from './fieldGoal';
import type { PlayTypeDefinition, SmartPlayContext, SmartPlayValues } from './playEditorTypes';

function id(context: SmartPlayContext): string {
  return `play_${Date.now()}_${context.gameId}`;
}

function numberValue(values: SmartPlayValues, key: string, fallback = 0): number {
  const value = values[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || fallback;
  return fallback;
}

function boolValue(values: SmartPlayValues, key: string): boolean {
  return values[key] === true;
}

function playerId(values: SmartPlayValues, key: string): string | undefined {
  const value = values[key];
  return typeof value === 'string' && value ? value : undefined;
}

export const PLAY_TYPE_REGISTRY: PlayTypeDefinition[] = [
  {
    kind: 'RUSH',
    label: 'Run',
    category: 'Offense',
    shortcut: 'R',
    description: 'Designed run, QB run, sweep, draw or similar rushing play.',
    fields: [
      { key: 'runnerId', label: 'Runner', kind: 'player', role: 'runner', required: true, group: 'offense' },
      { key: 'yards', label: 'Yards', kind: 'number', required: true, defaultValue: 0, group: 'core' },
      { key: 'direction', label: 'Direction', kind: 'select', group: 'core', options: [
        { label: 'Left', value: 'left' },
        { label: 'Middle', value: 'middle' },
        { label: 'Right', value: 'right' },
      ]},
      { key: 'tacklerId', label: 'Tackler', kind: 'player', role: 'tackler', group: 'defense' },
      { key: 'assistTacklerId', label: 'Assist Tackler', kind: 'player', role: 'assistTackler', group: 'defense' },
      { key: 'touchdown', label: 'Touchdown', kind: 'boolean', group: 'result' },
      { key: 'firstDown', label: 'First Down', kind: 'boolean', group: 'result' },
      { key: 'fumble', label: 'Fumble', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'RUSH',
        yards: numberValue(values, 'yards'),
        touchdown: boolValue(values, 'touchdown'),
        firstDown: boolValue(values, 'firstDown'),
        clockStartSeconds: context.clockStartSeconds,
        players: {
          rusherId: playerId(values, 'runnerId'),
          tacklerId: playerId(values, 'tacklerId'),
        },
      };
    },
  },
  {
    kind: 'PASS_COMPLETE',
    label: 'Pass Complete',
    category: 'Passing',
    shortcut: 'C',
    description: 'Completed forward pass.',
    fields: [
      { key: 'passerId', label: 'Passer', kind: 'player', role: 'passer', required: true, group: 'offense' },
      { key: 'receiverId', label: 'Receiver', kind: 'player', role: 'receiver', required: true, group: 'offense' },
      { key: 'yards', label: 'Total Yards', kind: 'number', required: true, defaultValue: 0, group: 'core' },
      { key: 'airYards', label: 'Air Yards', kind: 'number', defaultValue: 0, group: 'core' },
      { key: 'yac', label: 'YAC', kind: 'number', defaultValue: 0, group: 'core' },
      { key: 'tacklerId', label: 'Tackler', kind: 'player', role: 'tackler', group: 'defense' },
      { key: 'touchdown', label: 'Touchdown', kind: 'boolean', group: 'result' },
      { key: 'firstDown', label: 'First Down', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'PASS_COMPLETE',
        yards: numberValue(values, 'yards'),
        airYards: numberValue(values, 'airYards'),
        yac: numberValue(values, 'yac'),
        touchdown: boolValue(values, 'touchdown'),
        firstDown: boolValue(values, 'firstDown'),
        clockStartSeconds: context.clockStartSeconds,
        players: {
          passerId: playerId(values, 'passerId'),
          receiverId: playerId(values, 'receiverId'),
          tacklerId: playerId(values, 'tacklerId'),
        },
      };
    },
  },
  {
    kind: 'PASS_INCOMPLETE',
    label: 'Pass Incomplete',
    category: 'Passing',
    shortcut: 'I',
    description: 'Incomplete pass, drop, throwaway or pass breakup.',
    fields: [
      { key: 'passerId', label: 'Passer', kind: 'player', role: 'passer', required: true, group: 'offense' },
      { key: 'intendedReceiverId', label: 'Intended Receiver', kind: 'player', role: 'intendedReceiver', group: 'offense' },
      { key: 'targetDefenderId', label: 'Defender / PBU', kind: 'player', role: 'tackler', group: 'defense' },
      { key: 'reason', label: 'Reason', kind: 'select', group: 'result', options: [
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Drop', value: 'drop' },
        { label: 'Throw Away', value: 'throwaway' },
        { label: 'Pass Breakup', value: 'pbu' },
      ]},
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'PASS_INCOMPLETE',
        yards: 0,
        clockStartSeconds: context.clockStartSeconds,
        players: {
          passerId: playerId(values, 'passerId'),
          receiverId: playerId(values, 'intendedReceiverId'),
          tacklerId: playerId(values, 'targetDefenderId'),
        },
      };
    },
  },
  {
    kind: 'SACK',
    label: 'Sack',
    category: 'Passing',
    shortcut: 'S',
    description: 'Quarterback tackled behind the line before passing.',
    fields: [
      { key: 'passerId', label: 'Passer', kind: 'player', role: 'passer', required: true, group: 'offense' },
      { key: 'sackerId', label: 'Sacker', kind: 'player', role: 'sacker', required: true, group: 'defense' },
      { key: 'yards', label: 'Yards Lost', kind: 'number', required: true, defaultValue: -5, group: 'core' },
      { key: 'forcedFumbleId', label: 'Forced Fumble', kind: 'player', role: 'forcedFumble', group: 'defense' },
      { key: 'fumble', label: 'Fumble', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      const yards = numberValue(values, 'yards', -5);
      return {
        id: id(context),
        kind: 'SACK',
        yards: yards > 0 ? -yards : yards,
        clockStartSeconds: context.clockStartSeconds,
        players: {
          passerId: playerId(values, 'passerId'),
          tacklerId: playerId(values, 'sackerId'),
          forcedFumbleId: playerId(values, 'forcedFumbleId'),
        },
      };
    },
  },
  {
    kind: 'PUNT',
    label: 'Punt',
    category: 'Special Teams',
    shortcut: 'P',
    description: 'Punt including return, fair catch, touchback or downed ball.',
    fields: [
      { key: 'punterId', label: 'Punter', kind: 'player', role: 'punter', required: true, group: 'specialTeams' },
      { key: 'puntYards', label: 'Punt Yards', kind: 'number', required: true, defaultValue: 40, group: 'core' },
      { key: 'hasReturn', label: 'Return', kind: 'boolean', group: 'result' },
      { key: 'returnerId', label: 'Returner', kind: 'player', role: 'returner', group: 'specialTeams', showWhen: (v) => v.hasReturn === true },
      { key: 'returnYards', label: 'Return Yards', kind: 'number', defaultValue: 0, group: 'core', showWhen: (v) => v.hasReturn === true },
      { key: 'fairCatch', label: 'Fair Catch', kind: 'boolean', group: 'result' },
      { key: 'touchback', label: 'Touchback', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'PUNT',
        puntYards: numberValue(values, 'puntYards'),
        returnYards: numberValue(values, 'returnYards'),
        fairCatch: boolValue(values, 'fairCatch'),
        touchback: boolValue(values, 'touchback'),
        clockStartSeconds: context.clockStartSeconds,
        players: {
          punterId: playerId(values, 'punterId'),
          returnerId: playerId(values, 'returnerId'),
        },
      };
    },
  },
  {
    kind: 'KICKOFF',
    label: 'Kickoff',
    category: 'Special Teams',
    shortcut: 'K',
    description: 'Kickoff including touchback, return or onside kick.',
    fields: [
      { key: 'kickerId', label: 'Kicker', kind: 'player', role: 'kicker', required: true, group: 'specialTeams' },
      { key: 'kickYards', label: 'Kick Yards', kind: 'number', required: true, defaultValue: 60, group: 'core' },
      { key: 'touchback', label: 'Touchback', kind: 'boolean', group: 'result' },
      { key: 'onsideKick', label: 'Onside Kick', kind: 'boolean', group: 'result' },
      { key: 'kickingTeamRecovered', label: 'Kicking Team Recovered', kind: 'boolean', group: 'result', showWhen: (v) => v.onsideKick === true },
      { key: 'returnerId', label: 'Returner', kind: 'player', role: 'returner', group: 'specialTeams', showWhen: (v) => v.touchback !== true },
      { key: 'returnYards', label: 'Return Yards', kind: 'number', defaultValue: 0, group: 'core', showWhen: (v) => v.touchback !== true },
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'KICKOFF',
        kickYards: numberValue(values, 'kickYards'),
        returnYards: numberValue(values, 'returnYards'),
        touchback: boolValue(values, 'touchback'),
        onsideKick: boolValue(values, 'onsideKick'),
        kickingTeamRecovered: boolValue(values, 'kickingTeamRecovered'),
        clockStartSeconds: context.clockStartSeconds,
        players: {
          kickerId: playerId(values, 'kickerId'),
          returnerId: playerId(values, 'returnerId'),
        },
      };
    },
  },
  {
    kind: 'FIELD_GOAL_GOOD',
    label: 'Field Goal',
    category: 'Special Teams',
    shortcut: 'F',
    description: 'Field goal attempt. Distance is LOS-to-goal + 17.',
    fields: [
      { key: 'kickerId', label: 'Kicker', kind: 'player', role: 'kicker', required: true, group: 'specialTeams' },
      { key: 'fieldGoalLength', label: 'FG Distance', kind: 'computed', group: 'computed', help: 'LOS to goal + 17 yards.' },
      { key: 'good', label: 'Good', kind: 'boolean', defaultValue: true, group: 'result' },
      { key: 'blocked', label: 'Blocked', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      const length = fieldGoalDistanceFromAbsoluteYardline(context.absoluteYardline);
      const good = values.good !== false;
      return {
        id: id(context),
        kind: good ? 'FIELD_GOAL_GOOD' : 'FIELD_GOAL_MISSED',
        fieldGoalLength: length,
        clockStartSeconds: context.clockStartSeconds,
        players: {
          kickerId: playerId(values, 'kickerId'),
        },
      };
    },
  },
  {
    kind: 'INTERCEPTION',
    label: 'Interception',
    category: 'Turnover',
    shortcut: 'X',
    description: 'Pass intercepted by defense including return yards.',
    fields: [
      { key: 'passerId', label: 'Passer', kind: 'player', role: 'passer', required: true, group: 'offense' },
      { key: 'interceptorId', label: 'Interceptor', kind: 'player', role: 'interceptor', required: true, group: 'defense' },
      { key: 'yards', label: 'Pass Yards to INT Spot', kind: 'number', defaultValue: 0, group: 'core' },
      { key: 'returnYards', label: 'Return Yards', kind: 'number', defaultValue: 0, group: 'core' },
      { key: 'tacklerId', label: 'Tackler of Interceptor', kind: 'player', role: 'tackler', group: 'offense' },
      { key: 'touchdown', label: 'Pick Six', kind: 'boolean', group: 'result' },
    ],
    buildPlayInput(values, context) {
      return {
        id: id(context),
        kind: 'INTERCEPTION',
        yards: numberValue(values, 'yards'),
        returnYards: numberValue(values, 'returnYards'),
        touchdown: boolValue(values, 'touchdown'),
        turnover: true,
        clockStartSeconds: context.clockStartSeconds,
        players: {
          passerId: playerId(values, 'passerId'),
          interceptorId: playerId(values, 'interceptorId'),
          tacklerId: playerId(values, 'tacklerId'),
        },
      };
    },
  },
  {
    kind: 'FUMBLE',
    label: 'Fumble',
    category: 'Turnover',
    shortcut: 'U',
    description: 'Fumble by ball carrier with recovery and optional return.',
    fields: [
      { key: 'runnerId', label: 'Carrier', kind: 'player', role: 'runner', required: true, group: 'offense' },
      { key: 'yards', label: 'Yards Before Fumble', kind: 'number', defaultValue: 0, group: 'core' },
      { key: 'forcedFumbleId', label: 'Forced Fumble', kind: 'player', role: 'forcedFumble', group: 'defense' },
      { key: 'fumbleRecovererId', label: 'Recoverer', kind: 'player', role: 'fumbleRecoverer', required: true, group: 'result' },
      { key: 'offenseRecoveredFumble', label: 'Offense Recovered', kind: 'boolean', group: 'result' },
      { key: 'returnYards', label: 'Return Yards', kind: 'number', defaultValue: 0, group: 'core', showWhen: (v) => v.offenseRecoveredFumble !== true },
      { key: 'touchdown', label: 'Fumble Return TD', kind: 'boolean', group: 'result', showWhen: (v) => v.offenseRecoveredFumble !== true },
    ],
    buildPlayInput(values, context) {
      const offenseRecovered = boolValue(values, 'offenseRecoveredFumble');
      return {
        id: id(context),
        kind: 'FUMBLE',
        yards: numberValue(values, 'yards'),
        returnYards: numberValue(values, 'returnYards'),
        touchdown: boolValue(values, 'touchdown'),
        turnover: !offenseRecovered,
        offenseRecoveredFumble: offenseRecovered,
        clockStartSeconds: context.clockStartSeconds,
        players: {
          rusherId: playerId(values, 'runnerId'),
          forcedFumbleId: playerId(values, 'forcedFumbleId'),
          fumbleRecoveryId: playerId(values, 'fumbleRecovererId'),
        },
      };
    },
  },
];

export function getPlayTypeDefinition(kind: string): PlayTypeDefinition {
  const found = PLAY_TYPE_REGISTRY.find((p) => p.kind === kind);
  if (!found) return PLAY_TYPE_REGISTRY[0];
  return found;
}

export function defaultValuesForPlay(definition: PlayTypeDefinition, context: SmartPlayContext): SmartPlayValues {
  const values: SmartPlayValues = {};

  for (const field of definition.fields) {
    if (field.kind === 'computed' && field.key === 'fieldGoalLength') {
      values[field.key] = fieldGoalDistanceFromAbsoluteYardline(context.absoluteYardline);
      continue;
    }
    values[field.key] = field.defaultValue ?? (field.kind === 'boolean' ? false : '');
  }

  return values;
}

export function registryByCategory(): Record<string, PlayTypeDefinition[]> {
  return PLAY_TYPE_REGISTRY.reduce<Record<string, PlayTypeDefinition[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export function buildPlayInputFromDefinition(
  definition: PlayTypeDefinition,
  values: SmartPlayValues,
  context: SmartPlayContext,
): PlayInput {
  return definition.buildPlayInput(values, context);
}
