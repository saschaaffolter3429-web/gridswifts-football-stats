import { applyPlay, createInitialGameState, type GameState } from '../football-engine';
import type { Game as ApiGame } from '../api';
import type { StoredPlayEvent, RebuildResult, RebuiltTimelineItem } from './types';

type RebuildParams = {
  game: ApiGame;
  events: StoredPlayEvent[];
  receivingTeamId?: string;
  startAbsoluteYardline?: number;
};

export function createInitialStateForGame(params: {
  game: ApiGame;
  receivingTeamId?: string;
  startAbsoluteYardline?: number;
}): GameState {
  return createInitialGameState({
    gameId: params.game.id,
    homeTeamId: params.game.home_team_id,
    awayTeamId: params.game.away_team_id,
    receivingTeamId: params.receivingTeamId ?? params.game.home_team_id,
    startAbsoluteYardline: params.startAbsoluteYardline ?? 25,
    quarterLengthSeconds: params.game.quarter_length_seconds,
  });
}

export function rebuildGameStateFromEvents(params: RebuildParams): RebuildResult {
  let state = createInitialStateForGame({
    game: params.game,
    receivingTeamId: params.receivingTeamId,
    startAbsoluteYardline: params.startAbsoluteYardline,
  });

  const timeline: RebuiltTimelineItem[] = [];
  const warnings: string[] = [];
  const orderedEvents = [...params.events].sort((a, b) => a.seq - b.seq);

  for (const event of orderedEvents) {
    const result = applyPlay(state, event.play);
    state = result.next;
    timeline.push({
      eventId: event.id,
      seq: event.seq,
      play: event.play,
      description: event.description ?? result.description,
    });

    warnings.push(...result.warnings.map((warning) => `Event ${event.seq}: ${warning}`));
  }

  return { state, timeline, warnings };
}
