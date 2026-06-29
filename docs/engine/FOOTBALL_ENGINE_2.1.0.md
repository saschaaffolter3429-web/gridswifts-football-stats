# GridSwifts Football Engine 2.1.0

## Ziel

Die Engine ist unabhängig vom GUI. Sie funktioniert nach dem Prinzip:

```text
GameState + PlayInput = New GameState
```

Dadurch können später Play Log, Box Score, Broadcast, PDF und Excel alle dieselbe Wahrheit nutzen.

## Enthalten

- `GameState`
- `PlayInput`
- `RuleSet`
- `applyPlay`
- automatische Down/Distance-Berechnung
- Ballposition
- Score
- Drives
- erste Penalty-Logik
- Turnover-Grundlogik
- Field Goal / PAT / 2PT
- Kickoff / Punt-Grundlogik
- Safety-Grundlogik

## Zählregel für Team Total Plays

Es zählen nur:

- Rush
- Scramble
- Sack
- Pass Complete
- Pass Incomplete
- Interception

Nicht zählen:

- Penalty
- Timeout
- Kickoff
- Punt
- Field Goal
- PAT
- Two Point
- End Quarter

## Nächste Engine-Schritte

- echte Player-Stat-Aggregation
- Undo/Redo Event Sourcing
- vollständige Penalty Engine
- Play Edit/Recalculate
- Clock-Management pro Ruleset
- Live Game Binding an SQLite
