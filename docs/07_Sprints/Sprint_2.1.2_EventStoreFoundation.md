# Sprint 2.1.2 – Event Store Foundation

## Implemented

- Added SQLite `game_events` table.
- Added Rust/Tauri commands:
  - `list_game_events`
  - `save_game_event`
  - `get_game_event`
  - `delete_game_event`
  - `clear_game_events`
- Added TypeScript API wrappers.
- Added Event Store module:
  - `GameEventRepository.ts`
  - `rebuildGameState.ts`
  - event-store types and index export
- Live Scoring now persists every submitted play as an event.
- Selecting a game loads events from SQLite and rebuilds the full `GameState`.
- Deleting a timeline event soft-deletes it and rebuilds the game state.

## Current Limitations

- Events are stored and soft-deleted, but edit UI is not implemented yet.
- Reordering events is not implemented yet.
- Undo/Redo will be built on top of this foundation.

## Next Step

Sprint 2.1.3 should add Play Edit/Recalculate and Undo/Redo controls.
