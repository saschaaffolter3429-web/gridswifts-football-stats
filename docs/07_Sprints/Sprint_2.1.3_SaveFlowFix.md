# Sprint 2.1.3 Save Flow Fix

## Problem

Der SmartPlayEditor zeigte lokal „Play gespeichert“, obwohl der asynchrone Parent-Flow den Event Store noch nicht erfolgreich aktualisiert hatte.

## Fix

- `SmartPlayEditor.onApply` darf nun `Promise<void>` zurückgeben.
- `submit()` ist async und wartet auf den Parent-Flow.
- Der Button zeigt während des Speicherns `Speichert...`.
- Erfolgsmeldung erscheint erst nach erfolgreicher Event-Store-Speicherung.
- `LiveScoringPage.handleApply` hängt das gespeicherte Event robust in die Eventliste ein.
- `parseStoredPlayEvent` akzeptiert `PLAY` und `play`.

## Test

1. Live Scoring öffnen.
2. Spiel auswählen.
3. Pflichtfelder ausfüllen.
4. Play speichern.
5. Button zeigt `Speichert...`.
6. Event erscheint sofort in der Timeline.
7. App neu starten und prüfen, ob Event weiterhin geladen wird.
