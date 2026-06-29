import type { GameState, PlayInput } from '../football-engine';
import type { GameEvent } from '../api';

export type StoredPlayEvent = GameEvent & {
  play: PlayInput;
};

export type RebuildResult = {
  state: GameState;
  timeline: RebuiltTimelineItem[];
  warnings: string[];
};

export type RebuiltTimelineItem = {
  eventId: string;
  seq: number;
  play: PlayInput;
  description: string;
  before: GameState;
  after: GameState;
};
