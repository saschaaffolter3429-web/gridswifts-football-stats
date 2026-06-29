import type { Drive, GameClock, GameState, PlayInput } from './types';
import { countsAsDrivePlay } from './stats';

export function clockDelta(start?: number, end?: number): number {
  if (start === undefined || end === undefined) return 0;
  return Math.max(0, start - end);
}

export function newDriveId(gameId: string, index: number): string {
  return `${gameId}_drive_${index}`;
}

export function createDrive(state: GameState, teamId: string, startPlayIndex: number): Drive {
  return {
    id: newDriveId(state.gameId, state.completedDrives.length + 1),
    teamId,
    startPlayIndex,
    startClock: { ...state.clock },
    startAbsoluteYardline: state.absoluteYardline,
    offensivePlays: 0,
    yards: 0,
    durationSeconds: 0,
    result: 'In Progress',
  };
}

export function updateDriveForPlay(drive: Drive, play: PlayInput): Drive {
  const yards = play.yards ?? 0;
  return {
    ...drive,
    offensivePlays: drive.offensivePlays + (countsAsDrivePlay(play) ? 1 : 0),
    yards: drive.yards + (countsAsDrivePlay(play) ? yards : 0),
    durationSeconds: drive.durationSeconds + clockDelta(play.clockStartSeconds, play.clockEndSeconds),
  };
}

export function closeDrive(drive: Drive, play: PlayInput, clock: GameClock, absoluteYardline: number, result: string): Drive {
  return {
    ...drive,
    endPlayIndex: Number(play.id.replace(/\D/g, '')) || undefined,
    endClock: { ...clock },
    endAbsoluteYardline: absoluteYardline,
    result,
  };
}
