# Football Specification

## Rule Sets

GridSwifts soll langfristig mehrere Regelwerke unterstützen:

- IFAF
- NCAA
- NFL
- High School

## Grundlegende Spielzustände

Ein GameState enthält immer:

- Quarter
- Clock
- Possession
- Defense
- Ballposition
- Down
- Distance
- Goal-to-go
- Score
- Current Drive
- Completed Drives
- Play Index
- Messages / Warnings

## Total Plays

Für Team Total Plays zählen nur:

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
- Two Point Try
- End Quarter
- Injury Timeout
- Measurement
- Challenge

## Drive Plays

Die Drive-Ansicht verwendet dieselbe Play-Zählregel wie Team Total Plays.

## Drive-Enden

Ein Drive endet bei:

- Touchdown
- Field Goal Attempt
- Punt
- Interception
- Fumble Lost
- Turnover on Downs
- Safety
- Half End
- Game End

Sonderfälle:

- Fumble von Offense recovered durch Offense: Drive läuft weiter.
- Onside Kick recovered by kicking team: neuer Drive, aber gleiche Mannschaft.
