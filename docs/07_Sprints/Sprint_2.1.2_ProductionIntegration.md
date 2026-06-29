# Sprint 2.1.2 – Production Integration

## Part 1 Implemented

The Live Scoring module no longer uses demo players and demo teams.

## Implemented

- Loads games from SQLite via `listGames`.
- Loads teams via `listTeams`.
- Loads home and away rosters via `listPlayers`.
- Maps database players to Smart Play Editor players.
- Smart Play Editor now filters real players by offense/defense and role.
- Game header uses real team abbreviations and colors.
- The selected game creates the initial Football Engine `GameState`.

## Current Limitation

Plays are processed by the Football Engine but are not yet persisted to SQLite.

## Next Part

2.1.2 Part 2 should add:

- `game_events` table
- save play events after every submitted play
- load event history for selected game
- rebuild GameState from events
- edit/delete event and recalculate
