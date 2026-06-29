# Database Design

## Central Database

GridSwifts stores data in:

```text
Documents/GridSwifts Football Stats/gridswifts.db
```

## Core Tables

- teams
- players
- games
- plays
- drives
- penalties
- game_events
- settings
- exports

## Future Tables

- seasons
- leagues
- standings
- officials
- venues
- weather
- player_stats_cache
- team_stats_cache
- game_state_snapshots

## Migration Rule

Never destroy user data.

Every schema update must:

- preserve existing rows
- add missing columns safely
- use migrations
- support old databases where possible

## Backup Strategy

Future versions should create automatic backups before migrations:

```text
Backups/
  gridswifts_YYYY-MM-DD_HH-mm.db
```
