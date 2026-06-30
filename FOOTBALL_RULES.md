# GridSwifts Football Rules

## Rule Sets

GridSwifts should eventually support multiple rule sets:

- IFAF
- NCAA
- NFL
- High School
- Swiss American Football adaptations where needed

Rules should be configurable.

## Core Game State

A game state contains:

- quarter
- clock
- possession team
- defense team
- ball spot
- down
- distance
- goal-to-go
- score
- current drive
- completed drives
- timeouts
- play number
- messages
- warnings

## Plays Counting Toward Team Total Plays

Count:

- Rush
- Scramble
- Sack
- Pass Complete
- Pass Incomplete
- Interception

Do not count:

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

Drive play count must follow the same rule as team total plays.

## Kickoff Geometry

Kickoff is entered from the kicking team perspective.

Example:

```text
K35 + 55 yard kick = R10
R10 + 10 yard return = R20
```

Expected result:

Receiving team ball on own 20.

Formula:

```text
ReceivingSpot = 100 - (KickoffStart + KickYards) + ReturnYards
```

Touchback goes to rule-set touchback yardline.

Onside recovered by kicking team keeps possession with kicking team.

## Punt Geometry

Punt is entered from the punting team perspective.

After the punt, possession changes.

The receiving team spot is calculated from the punt landing spot and return.

## Turnovers

### Interception

Input:

- passer
- interceptor
- spot or pass yards to interception
- return yards
- tackler
- touchdown

Possession changes unless touchdown.

### Fumble

Input:

- carrier
- forced fumble
- recoverer
- recovery team
- return yards
- touchdown

If offense recovers, drive continues.

If defense recovers, possession changes.

## Scoring

Touchdown:

- +6
- requires PAT or two-point try

PAT:

- +1 if good

Two-point try:

- +2 if successful

Field goal:

- +3 if good

Safety:

- +2 for defense

## Field Goal Distance

Field goal distance:

```text
distance to goal line + 17
```

This includes:

- 10 yards endzone
- 7 yards snap/hold distance

## Penalties

Penalty engine should eventually support:

- live ball
- dead ball
- spot foul
- previous spot
- succeeding spot
- automatic first down
- loss of down
- replay down
- half the distance
- declined
- offsetting penalties

## Clock

Clock rules should eventually depend on rule set.

For now, clock can be manually entered and corrected per play.

Future:

- automatic clock suggestions
- running/stopped state
- timeout handling
- end quarter
- two-minute rules where applicable

