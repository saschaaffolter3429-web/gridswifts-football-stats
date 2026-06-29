# Sprint 2.1.4 – Timeline Manager Milestone A

## Implemented

- Rich Event Timeline with Play number, clock, down/distance and ball spot.
- Play details panel.
- Edit mode for common event fields:
  - description
  - yards
  - return yards
  - touchdown
  - first down
  - note
- Save edit via Event Store update.
- Delete play via Event Store soft delete.
- Automatic rebuild after edit/delete.
- Timeline items include before/after GameState snapshots.

## Current Scope

Editing focuses on common fields. Full play-type-specific edit forms will be added later by reusing the Smart Play Editor in edit mode.

## Test Checklist

1. Open Live Scoring.
2. Save at least three Plays.
3. Click a timeline item.
4. Confirm details appear.
5. Edit yards.
6. Save edit.
7. Confirm down/distance/ballposition rebuilds.
8. Delete a middle play.
9. Confirm later plays rebuild.
