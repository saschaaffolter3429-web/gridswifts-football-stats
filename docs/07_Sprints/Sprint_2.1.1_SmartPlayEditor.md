# Sprint 2.1.1 – Smart Play Editor

## Goal

Build the first real Smart Play Editor.

The editor dynamically shows only fields relevant to the selected play type.

## Required Features

### Play Type Selector

Groups:

- Offense
- Passing
- Special Teams
- Turnovers
- Administrative

### Dynamic Forms

Each play type has:

- required fields
- optional fields
- computed fields
- validation rules
- player role restrictions

### Player Filtering

Examples:

Run:
- Runner: offense RB, QB, WR, FB
- Tackler: defense DL, LB, CB, S

Pass:
- Passer: offense QB
- Receiver: offense WR, TE, RB
- Tackler: defense players
- Interceptor: defense players

Kickoff:
- Kicker: kicking team K
- Returner: receiving team KR/WR/RB/DB

### Field Goal Distance

Field goal distance must be:

```text
Line of Scrimmage distance to goal + 17
```

### Football IQ v1

Warnings:

- First down impossible based on yards.
- Same team selected as home and away.
- PAT without previous touchdown.
- Kickoff possession does not change unless onside recovered.
- Negative yardage creates invalid ball spot.

### Output

The editor produces a PlayInput object for the Football Engine.

## Definition of Done

- Smart Play Editor page exists.
- At least Run, Pass Complete, Incomplete, Punt, Kickoff, Field Goal, Interception and Fumble have dynamic forms.
- Fields are grouped by Offense, Defense, Special Teams.
- Player filtering exists in demo form.
- PlayInput can be submitted to Football Engine.
- Documentation updated.
