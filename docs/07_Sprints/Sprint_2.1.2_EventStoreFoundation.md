# Sprint 2.1.2 – Event Store Foundation

## Implemented

This sprint introduces the first persistent event-sourcing layer for GridSwifts.

## Database

New table:

```sql
game_events
```

Fields:

- `id`
- `game_id`
- `sequence`
- `quarter`
- `clock_start_seconds`
- `clock_end_seconds`
- `event_type`
- `payload_json`
- `created_at`
- `updated_at`
- `deleted_at`

Events are soft-deleted through `deleted_at` so future undo/redo and audit history remain possible.

## Rust / Tauri Commands

Added:

- `list_game_events`
- `get_game_event`
- `save_game_event`
- `update_game_event`
- `delete_game_event`
- `clear_game_events`

## TypeScript Event Store

New module:

```text
src/lib/game-events/eventStore.ts
```

Responsibilities:

- convert `PlayInput` to persistent event payloads
- save play events
- load events
- rebuild `GameState` from all active events
- produce timeline items
- prepare edit/delete/recalculate workflows

## Live Scoring Integration

Live Scoring now:

- loads a selected game
- loads real rosters
- loads all saved events for the game
- rebuilds the current `GameState` from events
- saves each submitted play as a `game_events` row
- reloads and rebuilds after every saved play
- supports soft-deleting individual timeline events
- supports clearing all events for a game

## Current Limitation

- Event editing UI is not yet implemented.
- Undo/redo is not yet implemented.
- Event Store currently persists PlayInput only, not full derived stats.

## Next Sprint

2.1.3 should add:

- edit existing event
- reorder/resequence events
- undo/redo stack
- full timeline cards
- event health checks
