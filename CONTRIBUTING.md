# Contributing to GridSwifts

## Branching

Never work directly on main.

Use feature branches:

```text
feature/kickoff-engine
feature/statistics-engine
feature/play-wizard
fix/event-store-save
```

## Commit Rules

Keep commits small.

Each commit should have one purpose.

Good:

```text
Fix kickoff placement calculation
Add event store regression test
Refactor field position helper
```

Bad:

```text
Update everything
Big changes
WIP
```

## Pull Requests

Every pull request should include:

- summary
- changed files
- manual test steps
- screenshots if UI changed
- risk assessment
- related issue

## Build

Before merging:

```text
npm install
npm run build
npm run tauri:dev
```

If tests exist:

```text
npm test
```

## Development Rules

- Do not break existing functionality.
- Do not introduce duplicate football logic.
- Do not add large features in one commit.
- Do not change UI and engine logic in the same PR unless necessary.
- Prefer small safe changes.
- Add documentation when architecture changes.
- Add regression tests for bugs.

## Quality Bar

A feature is done only when:

- app starts
- build passes
- manual test passes
- UI looks polished
- documentation updated
- no known regressions
- code is maintainable

