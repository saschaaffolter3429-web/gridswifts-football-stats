# Sprint 2.1.6 – Field Position Engine + Smart Play Wizard

## Implemented

- Central Field Position Engine.
- Correct kickoff geometry.
- Kickoff example fixed:
  - K35
  - 55 yard kick
  - 10 yard return
  - result: receiving team own 20.
- Punt placement now also uses the central placement helper.
- Interception and fumble return placement use the central change-of-possession helper.
- Smart Play Wizard panel added.
- Kickoff panel shows calculated receiving-team result before saving.
- Football IQ warns when kickoff geometry looks impossible.

## Field Position Rule

Kickoffs are entered from the kicking team's perspective:

```text
K35 + 55 kick = R10
R10 + 10 return = R20
```

Formula:

```text
Receiving spot = 100 - (kickoffStart + kickYards) + returnYards
```

## Manual Tests

1. Kickoff:
   - Start: 35
   - Kick: 55
   - Return: 10
   - Expected next ball: receiving team own 20

2. Kickoff touchback:
   - Start: 35
   - Kick: 65
   - Touchback checked
   - Expected next ball: touchback yardline from ruleset

3. Onside:
   - Start: 35
   - Kick: 10
   - Onside + recovered by kicking team
   - Expected next ball: kicking team own 45

4. Punt:
   - Own 40
   - Punt 42
   - Return 17
   - Expected next ball: receiving own 35
