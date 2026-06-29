# GridSwifts Football Platform – Project Vision

## Mission

GridSwifts soll die modernste Plattform Europas für American-Football-Datenerfassung, Live-Scoring, Analyse und Broadcast werden.

## Grundidee

Ein Spielzug wird genau einmal erfasst. Daraus entstehen automatisch:

- Live Score
- Down & Distance
- Ballposition
- Drive Summary
- Box Score
- Player Stats
- Team Stats
- Play-by-Play Timeline
- Broadcast GameCenter
- PDF Reports
- Excel Reports
- API / Web Ticker
- Saisonstatistiken

## Leitprinzipien

### 1. Football zuerst

Die Software wird nicht vom GUI aus gedacht, sondern von den Football-Regeln.

```text
Football Rules
  ↓
Football Engine
  ↓
Database
  ↓
UI
  ↓
Broadcast
  ↓
Exports
```

### 2. Eine Wahrheit

Ballposition, Score, Drives und Statistiken werden ausschließlich in der Football Engine berechnet.

### 3. Event Sourcing

Plays sind Events. Wird ein Play geändert, werden alle nachfolgenden Spielzustände neu berechnet.

### 4. Offline First

GridSwifts funktioniert vollständig ohne Internet.

### 5. Speed First

Ein erfahrener Statistiker soll einen normalen Spielzug in 2–3 Sekunden erfassen können.
