# Sprint 2.1.3 – Smart Play Engine Upgrade

## Implemented

- Play Templates
- Template buttons inside Smart Play Editor
- Keyboard shortcuts for play type selection
- Ctrl+Enter to submit play
- Football IQ v2 warnings
- More validation for:
  - Sack yardage
  - Field goal distance
  - Punt yardage
  - Kickoff touchback/return conflicts
  - Air Yards + YAC mismatch
  - 4th down turnover expectation
  - Fumble recoverer requirement
- Version label updated to 2.1.3

## Play Templates

Templates included:

- Run Left
- Run Middle
- Run Right
- QB Sneak
- Screen Pass
- Short Completion
- Deep Completion
- Drop
- Throw Away
- Sack
- Punt Fair Catch
- Punt Return
- Punt Touchback
- Kickoff Touchback
- Kickoff Return
- Onside Recovered
- FG Good
- FG Missed
- Interception
- Pick Six
- Fumble Lost
- Fumble Offense Recovery

## Test Checklist

1. App starts.
2. Select active game in Live Scoring.
3. Select each play type.
4. Confirm template buttons appear.
5. Apply a template.
6. Confirm fields are prefilled.
7. Submit with Ctrl+Enter.
8. Confirm event appears in timeline.
9. Delete event and confirm rebuild.
10. Test Football IQ warnings:
    - Pass Complete with YAC mismatch.
    - Sack with positive yards.
    - FG from own territory.
    - Punt with 0 yards.
    - Fumble lost without recoverer.
