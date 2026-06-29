# Test Plan

## Manual Tests

### Team Management
- Create team
- Edit team
- Delete team
- Add players
- Prevent duplicate jersey numbers

### Game Management
- Create game with two teams
- Prevent same team as home/away
- Save and reload game

### Football Engine
- Run +4 → 2nd & 6
- Pass +11 → first down
- Incomplete → next down
- Fourth down fail → turnover on downs
- Interception → possession change
- Fumble recovered by offense → drive continues
- Fumble lost → possession changes
- Field goal good → +3
- PAT good → +1
- Two point good → +2
- Punt → possession changes
- Onside recovered → same team new drive

## Future Automated Tests

Test framework should cover:

- engine state transitions
- penalties
- turnovers
- drive duration
- stats aggregation
- exports
