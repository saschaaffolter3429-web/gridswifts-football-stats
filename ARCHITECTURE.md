# GridSwifts Architecture

## Core Architecture

GridSwifts follows an event-sourced architecture.

The Event Store is the source of truth.

```text
Event Store
    ↓
Football Engine
    ↓
Game State
    ↓
Statistics Engine
    ↓
Reports / Broadcast / UI / API
```

## Layers

```text
React UI
    ↓
Application Services
    ↓
Football Engine
    ↓
Statistics Engine
    ↓
Event Store
    ↓
SQLite
```

## Rules

- React does not contain football rules.
- SQLite does not contain football calculations.
- Reports do not calculate football logic.
- Broadcast does not calculate football logic.
- Everything is derived from events.

## Event Store

The Event Store stores all game events.

Examples:

- game created
- coin toss
- kickoff
- run
- pass
- sack
- punt
- field goal
- touchdown
- PAT
- two-point try
- penalty
- timeout
- interception
- fumble
- end quarter
- end game

Events should contain enough information to rebuild the complete game.

## Football Engine

The Football Engine consumes events and produces GameState.

It handles:

- down
- distance
- possession
- ball spot
- score
- clock
- quarter
- drives
- first downs
- turnovers
- scoring
- penalties
- special teams

It must be deterministic.

## Field Position Engine

A dedicated Field Position Engine handles geometry.

It calculates:

- kickoff placement
- punt placement
- interception return
- fumble return
- touchback
- safety
- endzone
- goal line
- change of possession

No other part of the app should implement ball position math.

## Statistics Engine

The Statistics Engine consumes events and/or rebuilt game states.

It generates:

- team stats
- player stats
- drive stats
- box score
- red zone
- third down
- fourth down
- special teams
- defensive stats

## Broadcast Engine

The Broadcast Engine consumes:

- GameState
- Statistics
- Timeline

It outputs view models for:

- scoreboard
- field display
- drive chart
- player cards
- scoring graphics
- OBS overlays

## Report Engine

The Report Engine generates:

- PDF
- Excel
- CSV
- JSON
- HTML

Reports must not calculate football rules themselves.

## Future Architecture

Long-term structure may evolve into:

```text
packages/
  football-engine/
  statistics-engine/
  event-store/
  ui/
  broadcast/
  reports/
apps/
  desktop/
  web/
  mobile/
```

