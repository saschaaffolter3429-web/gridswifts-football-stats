import type { GameState, PlayInput } from '../football-engine';
import type { FootballIQWarning, PlayTypeDefinition, SmartPlayValues } from './playEditorTypes';

export function validateSmartPlay(params: {
  state: GameState;
  definition: PlayTypeDefinition;
  values: SmartPlayValues;
  play: PlayInput;
}): FootballIQWarning[] {
  const { state, definition, values, play } = params;
  const warnings: FootballIQWarning[] = [];

  for (const field of definition.fields) {
    if (field.required && field.showWhen?.(values) === false) continue;

    const value = values[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      warnings.push({
        severity: 'error',
        code: `missing_${field.key}`,
        message: `${field.label} ist ein Pflichtfeld.`,
      });
    }
  }

  const yards = Number(play.yards ?? 0);

  if (values.firstDown === true && yards < state.distance && !play.touchdown) {
    warnings.push({
      severity: 'warning',
      code: 'first_down_math_impossible',
      message: 'First Down wirkt mathematisch unmöglich: Raumgewinn ist kleiner als Distance.',
    });
  }

  if (state.down === 4 && !play.touchdown && play.kind !== 'PUNT' && play.kind !== 'FIELD_GOAL_GOOD' && play.kind !== 'FIELD_GOAL_MISSED') {
    if (yards < state.distance && values.firstDown !== true && play.kind !== 'INTERCEPTION' && play.kind !== 'FUMBLE') {
      warnings.push({
        severity: 'info',
        code: 'turnover_on_downs_expected',
        message: '4th Down ohne First Down: Turnover on Downs wird erwartet.',
      });
    }
  }

  if (state.absoluteYardline + yards > 100 && !play.touchdown) {
    warnings.push({
      severity: 'warning',
      code: 'touchdown_expected',
      message: 'Der Raumgewinn erreicht die Endzone. Touchdown prüfen.',
    });
  }

  if (state.absoluteYardline + yards <= 0 && !play.safety) {
    warnings.push({
      severity: 'warning',
      code: 'safety_expected',
      message: 'Der Ball landet hinter der eigenen Goal Line. Safety prüfen.',
    });
  }

  if (play.kind === 'PASS_COMPLETE') {
    const airYards = Number(play.airYards ?? 0);
    const yac = Number(play.yac ?? 0);
    if (airYards + yac !== yards) {
      warnings.push({
        severity: 'info',
        code: 'air_yards_yac_mismatch',
        message: 'Air Yards + YAC stimmt nicht mit Total Yards überein. Prüfen.',
      });
    }
  }

  if (play.kind === 'SACK' && yards > 0) {
    warnings.push({
      severity: 'error',
      code: 'sack_positive_yards',
      message: 'Ein Sack sollte negative Yards haben.',
    });
  }

  if (play.kind === 'KICKOFF') {
    if (play.touchback && Number(play.returnYards ?? 0) > 0) {
      warnings.push({
        severity: 'warning',
        code: 'touchback_with_return',
        message: 'Touchback und Return Yards passen normalerweise nicht zusammen.',
      });
    }

    if (play.onsideKick && Number(play.kickYards ?? 0) > 25) {
      warnings.push({
        severity: 'warning',
        code: 'onside_kick_too_long',
        message: 'Onside Kick mit mehr als 25 Kick Yards wirkt ungewöhnlich.',
      });
    }

    if (!play.touchback && !play.onsideKick && values.returnerId === '') {
      warnings.push({
        severity: 'info',
        code: 'kickoff_returner_missing',
        message: 'Bei Kickoff ohne Touchback ist meist ein Returner sinnvoll.',
      });
    }
  }

  if (play.kind === 'PUNT') {
    if (play.touchback && Number(play.returnYards ?? 0) > 0) {
      warnings.push({
        severity: 'warning',
        code: 'punt_touchback_with_return',
        message: 'Punt Touchback und Return Yards passen normalerweise nicht zusammen.',
      });
    }

    if (Number(play.puntYards ?? 0) <= 0) {
      warnings.push({
        severity: 'error',
        code: 'punt_yards_invalid',
        message: 'Punt Yards müssen größer als 0 sein.',
      });
    }
  }

  if (play.kind === 'FIELD_GOAL_GOOD' || play.kind === 'FIELD_GOAL_MISSED') {
    if (!play.fieldGoalLength || play.fieldGoalLength < 17) {
      warnings.push({
        severity: 'error',
        code: 'invalid_fg_length',
        message: 'Field-Goal-Distanz ist ungültig.',
      });
    }

    if ((play.fieldGoalLength ?? 0) > 70) {
      warnings.push({
        severity: 'warning',
        code: 'field_goal_very_long',
        message: 'Field Goal über 70 Yards wirkt extrem unwahrscheinlich. Ballposition prüfen.',
      });
    }
  }

  if (play.kind === 'FUMBLE' && !play.offenseRecoveredFumble && values.fumbleRecovererId === '') {
    warnings.push({
      severity: 'error',
      code: 'fumble_recoverer_required',
      message: 'Bei verlorenem Fumble muss ein Recoverer erfasst werden.',
    });
  }

  return warnings;
}

export function hasBlockingErrors(warnings: FootballIQWarning[]): boolean {
  return warnings.some((warning) => warning.severity === 'error');
}
