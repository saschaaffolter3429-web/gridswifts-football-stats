import type { GameState, PlayInput, PlayResult, RuleSetId, TeamId } from './types';
import { getRuleSet } from './rules';
import { clampYardline, flipForNewPossession, isGoalToGo, isSafetySpot, isTouchdownSpot, moveTowardOpponent, nextFirstDownLine, yardsToGoal } from './field';
import { createDrive, updateDriveForPlay } from './drive';

export function createInitialGameState(params: {
  gameId: string;
  ruleSet?: RuleSetId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  receivingTeamId: TeamId;
  startAbsoluteYardline?: number;
  quarterLengthSeconds?: number;
}): GameState {
  const ruleSet = getRuleSet(params.ruleSet ?? 'IFAF');
  const possessionTeamId = params.receivingTeamId;
  const defenseTeamId = possessionTeamId === params.homeTeamId ? params.awayTeamId : params.homeTeamId;
  const absoluteYardline = params.startAbsoluteYardline ?? ruleSet.touchbackYardline;
  const distance = Math.min(ruleSet.firstDownYards, yardsToGoal(absoluteYardline));

  const state: GameState = {
    gameId: params.gameId,
    ruleSet: ruleSet.id,
    homeTeamId: params.homeTeamId,
    awayTeamId: params.awayTeamId,
    clock: { quarter: '1', secondsRemaining: params.quarterLengthSeconds ?? 720 },
    score: {
      [params.homeTeamId]: 0,
      [params.awayTeamId]: 0,
    },
    possessionTeamId,
    defenseTeamId,
    absoluteYardline,
    down: 1,
    distance,
    goalToGo: isGoalToGo(absoluteYardline, distance),
    seriesStartAbsoluteYardline: absoluteYardline,
    nextFirstDownAbsoluteYardline: nextFirstDownLine(absoluteYardline, distance),
    currentDrive: {} as GameState['currentDrive'],
    completedDrives: [],
    playIndex: 0,
    messages: [],
  };

  state.currentDrive = createDrive(state, possessionTeamId, 1);
  return state;
}

export function applyPlay(state: GameState, play: PlayInput): PlayResult {
  const ruleSet = getRuleSet(state.ruleSet);
  const previous = structuredCloneSafe(state);
  const warnings: string[] = [];
  let next = structuredCloneSafe(state);
  next.playIndex += 1;
  next.messages = [];

  if (play.quarter !== undefined && play.quarter !== '') {
    next.clock.quarter = play.quarter;
  }

  if (play.clockEndSeconds !== undefined) {
    next.clock.secondsRemaining = play.clockEndSeconds;
  }

  next.currentDrive = updateDriveForPlay(next.currentDrive, play);

  const yards = play.yards ?? 0;

  switch (play.kind) {
    case 'RUSH':
    case 'SCRAMBLE':
    case 'PASS_COMPLETE':
    case 'SACK': {
      if (play.safety || isSafetySpot(state.absoluteYardline, yards)) {
        next.score[state.defenseTeamId] = (next.score[state.defenseTeamId] ?? 0) + ruleSet.safetyPoints;
        endDrive(next, play, 'Safety');
        changePossession(next, state.defenseTeamId, ruleSet.touchbackYardline);
        resetSeries(next);
        break;
      }

      if (play.touchdown || isTouchdownSpot(state.absoluteYardline, yards)) {
        next.score[state.possessionTeamId] = (next.score[state.possessionTeamId] ?? 0) + ruleSet.touchdownPoints;
        next.absoluteYardline = 99;
        endDrive(next, play, 'Touchdown');
        next.messages.push('Touchdown. PAT/2PT required next.');
        break;
      }

      next.absoluteYardline = moveTowardOpponent(state.absoluteYardline, yards);

      const madeFirstDown = play.firstDown || next.absoluteYardline >= state.nextFirstDownAbsoluteYardline;
      if (madeFirstDown) {
        next.down = 1;
        next.distance = Math.min(ruleSet.firstDownYards, yardsToGoal(next.absoluteYardline));
        next.seriesStartAbsoluteYardline = next.absoluteYardline;
        next.nextFirstDownAbsoluteYardline = nextFirstDownLine(next.absoluteYardline, next.distance);
        next.goalToGo = isGoalToGo(next.absoluteYardline, next.distance);
      } else {
        advanceDownOrTurnover(next, play);
      }

      break;
    }

    case 'PASS_INCOMPLETE':
    case 'SPIKE': {
      advanceDownOrTurnover(next, play);
      break;
    }

    case 'KNEEL': {
      next.absoluteYardline = moveTowardOpponent(state.absoluteYardline, yards || -1);
      advanceDownOrTurnover(next, play);
      break;
    }

    case 'INTERCEPTION': {
      const catchSpot = clampYardline(state.absoluteYardline + yards);
      const returnYards = play.returnYards ?? 0;

      if (play.touchdown || catchSpot - returnYards <= 0) {
        next.score[state.defenseTeamId] = (next.score[state.defenseTeamId] ?? 0) + ruleSet.touchdownPoints;
        endDrive(next, play, 'Interception TD');
        changePossession(next, state.defenseTeamId, 99);
        next.messages.push('Defensive touchdown. PAT/2PT required next.');
      } else {
        const newOffenseSpot = flipForNewPossession(catchSpot - returnYards);
        endDrive(next, play, 'Interception');
        changePossession(next, state.defenseTeamId, newOffenseSpot);
        resetSeries(next);
      }
      break;
    }

    case 'FUMBLE': {
      const fumbleSpot = clampYardline(state.absoluteYardline + yards);
      if (play.offenseRecoveredFumble || !play.turnover) {
        next.absoluteYardline = fumbleSpot;
        const madeFirstDown = next.absoluteYardline >= state.nextFirstDownAbsoluteYardline;
        if (madeFirstDown) resetSeries(next);
        else advanceDownOrTurnover(next, play);
      } else {
        const returnYards = play.returnYards ?? 0;
        if (play.touchdown || fumbleSpot - returnYards <= 0) {
          next.score[state.defenseTeamId] = (next.score[state.defenseTeamId] ?? 0) + ruleSet.touchdownPoints;
          endDrive(next, play, 'Fumble Return TD');
          changePossession(next, state.defenseTeamId, 99);
          next.messages.push('Defensive touchdown. PAT/2PT required next.');
        } else {
          const newOffenseSpot = flipForNewPossession(fumbleSpot - returnYards);
          endDrive(next, play, 'Fumble Lost');
          changePossession(next, state.defenseTeamId, newOffenseSpot);
          resetSeries(next);
        }
      }
      break;
    }

    case 'PUNT': {
      const puntYards = play.puntYards ?? 0;
      const returnYards = play.returnYards ?? 0;
      const endSpot = clampYardline(state.absoluteYardline + puntYards - returnYards);

      endDrive(next, play, 'Punt');

      if (play.touchback) {
        changePossession(next, state.defenseTeamId, ruleSet.touchbackYardline);
      } else {
        changePossession(next, state.defenseTeamId, flipForNewPossession(endSpot));
      }

      resetSeries(next);
      break;
    }

    case 'KICKOFF': {
      const kickYards = play.kickYards ?? 0;
      const returnYards = play.returnYards ?? 0;
      const landingSpot = clampYardline(kickYards);
      const receivingSpot = clampYardline(ruleSet.fieldLength - landingSpot + returnYards);
      const kickingTeamId = play.kickingTeamId ?? state.possessionTeamId;
      const receivingTeamId = play.receivingTeamId ?? state.defenseTeamId;

      if (play.onsideKick && play.kickingTeamRecovered) {
        changePossession(next, kickingTeamId, clampYardline((play.kickoffStartYardline ?? state.absoluteYardline) + 10));
        resetSeries(next);
        next.messages.push('Onside kick recovered by kicking team.');
      } else if (play.touchback) {
        changePossession(next, receivingTeamId, ruleSet.touchbackYardline);
        resetSeries(next);
      } else {
        changePossession(next, receivingTeamId, receivingSpot);
        resetSeries(next);
      }
      break;
    }

    case 'FIELD_GOAL_GOOD': {
      next.score[state.possessionTeamId] = (next.score[state.possessionTeamId] ?? 0) + ruleSet.fieldGoalPoints;
      endDrive(next, play, 'Field Goal');
      next.messages.push('Field goal good. Kickoff next.');
      break;
    }

    case 'FIELD_GOAL_MISSED': {
      endDrive(next, play, 'Missed Field Goal');
      changePossession(next, state.defenseTeamId, flipForNewPossession(state.absoluteYardline));
      resetSeries(next);
      break;
    }

    case 'PAT_GOOD': {
      next.score[state.possessionTeamId] = (next.score[state.possessionTeamId] ?? 0) + ruleSet.patKickPoints;
      next.messages.push('PAT good. Kickoff next.');
      break;
    }

    case 'TWO_POINT_GOOD': {
      next.score[state.possessionTeamId] = (next.score[state.possessionTeamId] ?? 0) + ruleSet.twoPointPoints;
      next.messages.push('2PT good. Kickoff next.');
      break;
    }

    case 'PAT_MISSED':
    case 'TWO_POINT_FAILED': {
      next.messages.push('Try failed. Kickoff next.');
      break;
    }

    case 'PENALTY': {
      applyPenalty(next, play);
      break;
    }

    case 'TIMEOUT':
    case 'END_QUARTER':
    default:
      break;
  }

  validateState(next, warnings);

  return {
    previous,
    play,
    next,
    description: describePlay(previous, play, next),
    warnings,
  };
}

function advanceDownOrTurnover(state: GameState, play: PlayInput): void {
  if (state.down === 4) {
    endDrive(state, play, 'Turnover on Downs');
    changePossession(state, state.defenseTeamId, flipForNewPossession(state.absoluteYardline));
    resetSeries(state);
    return;
  }

  state.down = (state.down + 1) as GameState['down'];
  state.distance = Math.max(1, state.nextFirstDownAbsoluteYardline - state.absoluteYardline);
  state.goalToGo = isGoalToGo(state.absoluteYardline, state.distance);
}

function resetSeries(state: GameState): void {
  state.down = 1;
  state.distance = Math.min(10, yardsToGoal(state.absoluteYardline));
  state.goalToGo = isGoalToGo(state.absoluteYardline, state.distance);
  state.seriesStartAbsoluteYardline = state.absoluteYardline;
  state.nextFirstDownAbsoluteYardline = nextFirstDownLine(state.absoluteYardline, state.distance);
}

function changePossession(state: GameState, newOffenseTeamId: TeamId, newAbsoluteYardline: number): void {
  const oldOffense = state.possessionTeamId;
  state.possessionTeamId = newOffenseTeamId;
  state.defenseTeamId = newOffenseTeamId === state.homeTeamId ? state.awayTeamId : state.homeTeamId;
  state.absoluteYardline = clampYardline(newAbsoluteYardline);

  if (oldOffense !== newOffenseTeamId) {
    state.currentDrive = createDrive(state, newOffenseTeamId, state.playIndex + 1);
  }
}

function endDrive(state: GameState, play: PlayInput, result: string): void {
  state.completedDrives.push({
    ...state.currentDrive,
    endPlayIndex: state.playIndex,
    endClock: { ...state.clock },
    endAbsoluteYardline: state.absoluteYardline,
    result,
  });
}

function applyPenalty(state: GameState, play: PlayInput): void {
  const penalty = play.penalty;
  if (!penalty || penalty.declined) return;

  const againstOffense = penalty.teamId === state.possessionTeamId;
  const signedYards = againstOffense ? -penalty.yards : penalty.yards;
  state.absoluteYardline = moveTowardOpponent(state.absoluteYardline, signedYards);

  if (penalty.automaticFirstDown) {
    resetSeries(state);
  } else if (penalty.lossOfDown) {
    advanceDownOrTurnover(state, play);
  } else {
    state.distance = Math.max(1, state.nextFirstDownAbsoluteYardline - state.absoluteYardline);
  }
}

function validateState(state: GameState, warnings: string[]): void {
  if (state.absoluteYardline < 1 || state.absoluteYardline > 99) {
    warnings.push('Ballposition außerhalb des Spielfelds.');
  }

  if (state.distance < 1) {
    warnings.push('Distance ist kleiner als 1.');
  }

  if (state.down < 1 || state.down > 4) {
    warnings.push('Ungültiger Down.');
  }
}

function describePlay(previous: GameState, play: PlayInput, next: GameState): string {
  const yards = play.yards ?? 0;
  const sign = yards > 0 ? '+' : '';
  return `${play.kind} ${sign}${yards} | ${next.down} & ${next.distance} @ ${next.absoluteYardline}`;
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
