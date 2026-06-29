# Sprint 2.1.1 – Smart Play Editor Implementation

## Implemented

- Play Type Registry
- Dynamic play fields
- Field grouping
- Role-based player filtering
- Field Goal distance computation
- Football IQ v1 warnings
- PlayInput preview
- Engine submit integration
- Live Scoring demo uses Smart Play Editor

## Supported Play Types in v2.1.1

- Run
- Pass Complete
- Pass Incomplete
- Sack
- Punt
- Kickoff
- Field Goal
- Interception
- Fumble

## Current Scope

This is still a demo integration using demo players and demo teams.

## Next Step

Sprint 2.1.2 must connect the Smart Play Editor to real selected games and rosters from SQLite.

## Definition of Done Check

- Dynamic fields change by play type.
- Required fields create Football IQ errors.
- Player dropdowns are filtered by offense/defense and role.
- Field Goal distance is automatically computed as LOS-to-goal + 17.
- Submitted plays update GameState via Football Engine.
