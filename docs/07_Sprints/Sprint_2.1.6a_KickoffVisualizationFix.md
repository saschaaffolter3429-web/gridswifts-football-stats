# Sprint 2.1.6a – Kickoff Visualization Fix

## Fixed

- Removed ReferenceError caused by an undefined `landingYardlineFromReceivingGoal`.
- Kickoff preview now uses `calculateKickoffPlacement()` directly.
- Kickoff preview now displays:
  - Kick spot
  - Landing spot from receiving team perspective
  - New ball position
  - Text description from Field Position Engine

## Test

Example:

- Kickoff start: 35
- Kick yards: 55
- Return yards: 10

Expected preview and saved result:

- Landing: receiving 10
- New ball: receiving 20
