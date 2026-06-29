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

  const yards = play.yards ?? 0;

  if (values.firstDown === true && yards < state.distance && !play.touchdown) {
    warnings.push({
      severity: 'warning',
      code: 'first_down_math_impossible',
      message: 'First Down wirkt mathematisch unmöglich: Raumgewinn ist kleiner als Distance.',
    });
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

  if (play.kind === 'KICKOFF' && play.onsideKick && !play.kickingTeamRecovered && values.returnerId === '') {
    warnings.push({
      severity: 'info',
      code: 'kickoff_returner_missing',
      message: 'Bei Kickoff ohne Touchback ist meist ein Returner sinnvoll.',
    });
  }

  if (play.kind === 'FIELD_GOAL_GOOD' || play.kind === 'FIELD_GOAL_MISSED') {
    if (!play.fieldGoalLength || play.fieldGoalLength < 17) {
      warnings.push({
        severity: 'error',
        code: 'invalid_fg_length',
        message: 'Field-Goal-Distanz ist ungültig.',
      });
    }
  }

  return warnings;
}

export function hasBlockingErrors(warnings: FootballIQWarning[]): boolean {
  return warnings.some((warning) => warning.severity === 'error');
}
