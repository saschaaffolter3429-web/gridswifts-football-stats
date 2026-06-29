# Manual Engine Tests

## Test 1: Run +4

Start: 1st & 10 @ HOME 25  
Play: RUSH +4  
Expected: 2nd & 6 @ HOME 29

## Test 2: Pass +11

Start: 1st & 10 @ HOME 25  
Play: PASS_COMPLETE +11  
Expected: 1st & 10 @ HOME 36

## Test 3: Incomplete Pass

Start: 1st & 10 @ HOME 25  
Play: PASS_INCOMPLETE  
Expected: 2nd & 10 @ HOME 25

## Test 4: Interception

Start: HOME ball  
Play: INTERCEPTION  
Expected: possession changes to AWAY

## Test 5: Field Goal Good

Play: FIELD_GOAL_GOOD  
Expected: +3 points for offense, drive closed

## Test 6: Fourth down failed

Start: 4th down  
Play without first down  
Expected: Turnover on Downs, possession changes
