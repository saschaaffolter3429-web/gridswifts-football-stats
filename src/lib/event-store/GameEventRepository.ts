import {
  deleteGameEvent,
  listGameEvents,
  saveGameEvent,
  type GameEvent,
  type GameEventInput,
} from '../api';
import type { PlayInput } from '../football-engine';
import type { StoredPlayEvent } from './types';

export async function loadPlayEvents(gameId: string): Promise<StoredPlayEvent[]> {
  const events = await listGameEvents(gameId);
  return events
    .map(parseStoredPlayEvent)
    .filter((event): event is StoredPlayEvent => event !== null);
}

export async function appendPlayEvent(params: {
  gameId: string;
  play: PlayInput;
  description?: string;
}): Promise<StoredPlayEvent> {
  const input: GameEventInput = {
    game_id: params.gameId,
    event_type: 'PLAY',
    payload_json: JSON.stringify(params.play),
    description: params.description ?? null,
  };

  const saved = await saveGameEvent(input);
  const parsed = parseStoredPlayEvent(saved);
  if (!parsed) throw new Error('Gespeichertes Event konnte nicht gelesen werden.');
  return parsed;
}

export async function updatePlayEvent(params: {
  eventId: string;
  gameId: string;
  seq: number;
  play: PlayInput;
  description?: string;
}): Promise<StoredPlayEvent> {
  const input: GameEventInput = {
    id: params.eventId,
    game_id: params.gameId,
    seq: params.seq,
    event_type: 'PLAY',
    payload_json: JSON.stringify(params.play),
    description: params.description ?? null,
  };

  const saved = await saveGameEvent(input);
  const parsed = parseStoredPlayEvent(saved);
  if (!parsed) throw new Error('Aktualisiertes Event konnte nicht gelesen werden.');
  return parsed;
}

export async function removePlayEvent(eventId: string): Promise<void> {
  await deleteGameEvent(eventId);
}

export function parseStoredPlayEvent(event: GameEvent): StoredPlayEvent | null {
  if (event.event_type.toUpperCase() !== 'PLAY') return null;

  try {
    return {
      ...event,
      play: JSON.parse(event.payload_json) as PlayInput,
    };
  } catch {
    return null;
  }
}
