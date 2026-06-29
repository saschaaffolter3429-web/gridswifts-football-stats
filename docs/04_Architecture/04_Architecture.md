# Architecture

## Layers

```text
UI Layer
  ↓
Application Services
  ↓
Football Engine
  ↓
Data Engine
  ↓
SQLite
```

## Football Engine

The Football Engine is pure TypeScript and should not depend on React or Tauri.

Input:

```text
GameState + PlayInput
```

Output:

```text
PlayResult + New GameState
```

## Application Services

Responsible for:

- loading games from SQLite
- saving play events
- recalculating game state
- providing data to UI
- exports

## UI Layer

Responsible only for:

- rendering data
- collecting user input
- keyboard shortcuts
- visual feedback

No football calculations should live inside UI components.

## Event Sourcing

Play events are the source of truth.

When a play is edited:
1. Save edited event.
2. Rebuild GameState from first event.
3. Recalculate drives, stats, score, timeline.
4. Refresh UI.

## Future Packages

Long term structure:

```text
packages/
  football-engine/
  ui/
  database/
  export-pdf/
  export-excel/
  broadcast/
apps/
  desktop/
  web/
```
