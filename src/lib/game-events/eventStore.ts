import {
  listGameEvents,
  saveGameEvent,
  updateGameEvent,
  deleteGameEvent,
  clearGameEvents,
  type Game,
  type GameEvent,
  type GameEventInput,
  type GameEventUpdateInput,
} from '../api';
import {
  applyPlay,
  createInitialGameState,
  type GameState,
  type PlayInput,
  type PlayResult,
} from '../football-engine';

export type RebuildResult = {
  initialState: GameState;
  finalState: GameState;
  results: PlayResult[];
  timeline: TimelineItem[];
  events: GameEvent[];
  errors: string[];
};

export type TimelineItem = {
  event: GameEvent;
  play: PlayInput;
  description: string;
  stateAfter: GameState;
};

export function playToEventInput(params: {
  gameId: string;
  play: PlayInput;
  quarter: string;
  clockStartSeconds?: number | null;
  clockEndSeconds?: number | null;
}): GameEventInput {
  return {
    game_id: params.gameId,
    quarter: params.quarter,
    clock_start_seconds: params.clockStartSeconds ?? params.play.clockStartSeconds ?? null,
    clock_end_seconds: params.clockEndSeconds ?? params.play.clockEndSeconds ?? null,
    event_type: params.play.kind,
    payload_json: JSON.stringify(params.play),
  };
}

export function parseEventPayload(event: GameEvent): PlayInput {
  const parsed = JSON.parse(event.payload_json) as PlayInput;
  return {
    ...parsed,
    id: parsed.id || event.id,
  };
}

export async function appendPlayEvent(params: {
  gameId: string;
  play: PlayInput;
  quarter: string;
  clockStartSeconds?: number | null;
  clockEndSeconds?: number | null;
}): Promise<GameEvent> {
  return saveGameEvent(playToEventInput(params));
}

export async function replacePlayEvent(params: {
  eventId: string;
  play: PlayInput;
  quarter?: string | null;
  clockStartSeconds?: number | null;
  clockEndSeconds?: number | null;
}): Promise<GameEvent> {
  const input: GameEventUpdateInput = {
    id: params.eventId,
    quarter: params.quarter,
    clock_start_seconds: params.clockStartSeconds ?? params.play.clockStartSeconds ?? null,
    clock_end_seconds: params.clockEndSeconds ?? params.play.clockEndSeconds ?? null,
    event_type: params.play.kind,
    payload_json: JSON.stringify(params.play),
  };

  return updateGameEvent(input);
}

export async function softDeletePlayEvent(eventId: string): Promise<void> {
  return deleteGameEvent(eventId);
}

export async function softClearGameEvents(gameId: string): Promise<void> {
  return clearGameEvents(gameId);
}

export async function loadAndRebuildGame(params: {
  game: Game;
  receivingTeamId?: string;
  startAbsoluteYardline?: number;
}): Promise<RebuildResult> {
  const events = await listGameEvents(params.game.id);
  return rebuildGameStateFromEvents({
    game: params.game,
    events,
    receivingTeamId: params.receivingTeamId,
    startAbsoluteYardline: params.startAbsoluteYardline,
  });
}

export function rebuildGameStateFromEvents(params: {
  game: Game;
  events: GameEvent[];
  receivingTeamId?: string;
  startAbsoluteYardline?: number;
}): RebuildResult {
  const initialState = createInitialGameState({
    gameId: params.game.id,
    homeTeamId: params.game.home_team_id,
    awayTeamId: params.game.away_team_id,
    receivingTeamId: params.receivingTeamId ?? params.game.home_team_id,
    startAbsoluteYardline: params.startAbsoluteYardline ?? 25,
    quarterLengthSeconds: params.game.quarter_length_seconds,
  });

  let state = initialState;
  const results: PlayResult[] = [];
  const timeline: TimelineItem[] = [];
  const errors: string[] = [];

  const activeEvents = [...params.events]
    .filter((event) => !event.deleted_at)
    .sort((a, b) => a.sequence - b.sequence);

  for (const event of activeEvents) {
    try {
      const play = parseEventPayload(event);
      const result = applyPlay(state, play);
      state = result.next;
      results.push(result);
      timeline.push({
        event,
        play,
        description: result.description,
        stateAfter: result.next,
      });
    } catch (error) {
      errors.push(`Event ${event.sequence} konnte nicht verarbeitet werden: ${String(error)}`);
    }
  }

  return {
    initialState,
    finalState: state,
    results,
    timeline,
    events: activeEvents,
    errors,
  };
}
