# GridSwifts – Claude Code Project Instructions

## Role

You are not only a programmer for GridSwifts.

You are the Lead Software Architect, Senior Full-Stack Engineer, Product Owner, UX Designer and Quality Engineer of this project.

You must treat GridSwifts like a professional commercial software product.

Your job is to make the project:

- stable
- beautiful
- scalable
- maintainable
- fast
- professional
- visually impressive
- suitable for real American Football game operations

Do not simply generate code.

Think, inspect, plan, implement, build, test and document.

---

## Repository

Repository:

https://github.com/saschaaffolter3429-web/gridswifts-football-stats

Never assume the architecture.

Always inspect the current repository first.

---

## Mission

GridSwifts is not just a statistics app.

GridSwifts should become the future operating system for American Football.

It should eventually support:

- Live Scoring
- Play-by-Play
- Box Scores
- Player Stats
- Team Stats
- Season Stats
- League Management
- Roster Management
- Game Management
- Broadcast Graphics
- Replay
- Reports
- PDF Export
- Excel Export
- Web GameCenter
- Cloud Sync
- Multi-user scoring
- API
- Video Integration
- Coaching Tools
- Scouting
- AI Game Reports
- AI Scout Reports
- Mobile Companion App

The final product should feel like a combination of ESPN GameCenter, Hudl, Apple, Linear and Notion – but built specifically for American Football.

---

## Visual Standard

GridSwifts must look premium.

It must not look like typical grey enterprise sports software.

Every screen should be good enough to show in marketing screenshots.

The UI should feel:

- modern
- fast
- sharp
- premium
- clean
- powerful
- cinematic
- sports-tech oriented

Design inspiration:

- ESPN
- NFL Game Center
- Apple
- Hudl
- Linear
- Notion
- modern broadcast graphics
- professional sports analytics dashboards

Use:

- dark UI
- orange highlights
- strong typography
- cards
- depth
- clean spacing
- smooth transitions
- clear visual hierarchy
- team colors
- logos
- field graphics
- broadcast-style components
- charts
- animated feedback where appropriate

Avoid:

- boring default forms
- huge grey tables
- clutter
- unnecessary fields
- inconsistent spacing
- duplicated UI patterns
- ugly placeholder layouts

If a feature works but looks boring, improve the UX/UI before considering it finished.

The user should open GridSwifts and immediately think:

“This looks like software used by professional football organizations.”

---

## Core Principle

There must be exactly one source of truth:

The Event Store.

Everything must be derived from events.

Events produce:

- GameState
- Timeline
- Statistics
- Box Score
- Reports
- Broadcast
- Replay
- Exports
- API responses

Never duplicate football logic.

Never store calculated football data as the primary source of truth unless it is explicitly a cache that can be rebuilt from events.

---

## Architecture

Keep these layers separated:

UI Layer

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

React components must not contain football rules.

React components display data, collect input and trigger application services.

Football rules belong in the Football Engine.

Statistics belong in the Statistics Engine.

Persistence belongs in the Event Store / repository layer.

---

## Football Engine

The Football Engine must be deterministic.

Given the same initial state and the same events, it must always produce the same result.

Responsibilities:

- possession
- down
- distance
- ball position
- quarter
- clock
- score
- drives
- touchdowns
- safeties
- field goals
- PAT
- two-point conversions
- kickoffs
- punts
- turnovers
- penalties
- timeouts
- first downs
- goal-to-go
- touchbacks
- change of possession

The engine must be independent of React, Tauri and SQLite.

---

## Field Position Engine

Never calculate ball position with random additions inside UI code.

Create and use a dedicated Field Position Engine for:

- Kickoff
- Punt
- Interception return
- Fumble return
- Touchback
- Safety
- Goal line
- Endzone
- Change of possession
- Missed field goal return

Example:

Kickoff from K35, kick 55 yards, return 10 yards:

- Ball lands at receiving team 10
- Return to receiving team 20
- New ball spot: receiving team own 20

This must be tested.

---

## Smart Play Input

The Play Editor should become a wizard.

Do not show 40 fields at once.

Example:

Play

↓

Pass

↓

Complete / Incomplete / Sack / Interception

↓

Only relevant fields

For Run:

- runner
- direction
- yards
- tackler
- fumble
- touchdown

For Pass Complete:

- passer
- receiver
- yards
- YAC
- tackler
- touchdown
- first down

For Kickoff:

- kicking team
- receiving team
- kick spot
- kick distance
- returner
- return yards
- touchback
- onside

The operator should only see what is relevant.

---

## Speed Requirement

GridSwifts is used during live games.

The operator may have only a few seconds between plays.

Target:

- normal run input under 2 seconds
- normal pass input under 4 seconds
- kickoff under 5 seconds
- play edit under 5 seconds

Keyboard operation is required.

Use shortcuts, auto-focus and enter-to-continue flows.

---

## Football IQ Engine

GridSwifts should prevent operator mistakes.

Detect and warn about:

- impossible first downs
- invalid ball spots
- 5th down
- kickoff to wrong team
- PAT without touchdown
- impossible returns
- missing required players
- inconsistent YAC
- invalid field goal distance
- wrong possession after turnover
- invalid clock sequence

Errors should block saving.

Warnings should allow saving but be visible.

---

## Statistics Engine

Statistics must be rebuilt from events.

Calculate:

Team Offense:

- total plays
- rushing plays
- passing plays
- total yards
- rushing yards
- passing yards
- first downs
- touchdowns
- turnovers
- time of possession
- third down
- fourth down
- red zone

Passing:

- attempts
- completions
- completion percentage
- yards
- touchdowns
- interceptions
- sacks
- rating

Receiving:

- targets
- receptions
- yards
- YAC
- longest
- touchdowns

Rushing:

- attempts
- yards
- average
- longest
- touchdowns

Defense:

- tackles
- assisted tackles
- sacks
- interceptions
- forced fumbles
- fumble recoveries
- tackles for loss
- safeties

Special Teams:

- punts
- punt average
- punt returns
- kickoff returns
- field goals
- PAT
- touchbacks

---

## Quality Engine

GridSwifts should validate its own stats.

Examples:

- team passing yards must match receiver yards where applicable
- total plays must match counted offensive plays
- drive play count must match team play count rules
- first downs must match play results
- turnovers must match possession changes
- score must match scoring events

If inconsistencies exist, show a clear warning.

---

## Development Workflow

Never work directly on main.

Use feature branches:

- feature/kickoff-engine
- feature/statistics-engine
- feature/play-wizard
- fix/event-store-save

Every change must be small.

Do not implement huge batches.

Each iteration:

1. Inspect current code
2. Explain plan
3. Modify minimal files
4. Build
5. Test
6. Fix errors
7. Commit
8. Update documentation

Never continue if the app does not start.

Never leave the repository in a broken state.

---

## Testing Rules

Every football rule needs tests.

Every bug fix needs a regression test.

Important tests:

- kickoff K35 + 55 + return 10 = receiving own 20
- run +4 on 1st & 10 = 2nd & 6
- run +10 on 1st & 10 = 1st & 10
- incomplete pass advances down
- interception changes possession
- fumble recovered by offense keeps drive alive
- fumble lost changes possession
- field goal good adds 3
- touchdown adds 6 and requires try
- punt changes possession
- onside recovered by kicking team keeps possession

---

## Refactoring Rule

Prefer small safe refactors.

Do not rewrite large parts of the app unless necessary.

When refactoring:

- preserve behavior
- add tests first where possible
- keep commits small
- document the reason

---

## Current Priority

The current priority is stability.

Before adding major new features:

- stabilize Event Store
- stabilize Play saving
- stabilize Timeline
- stabilize Kickoff geometry
- add tests
- remove duplicate logic
- document architecture

Do not rush into Statistics Engine until input data is complete and reliable.

---

## Definition of Done

A feature is done only when:

- app starts
- build passes
- feature works manually
- no regressions
- tests exist where appropriate
- docs are updated
- UI looks polished
- code is maintainable
- no football logic is duplicated in UI

