# Specification: Refactor Use Cases and Unit Tests

## Metadata
- **ID**: spec-2026-03-06-use-cases
- **Status**: draft
- **Created**: 2026-03-06

## Problem Statement
Business logic is currently scattered between UI components and hooks, making it hard to test and re-use. Side effects are often coupled with data fetching and UI state.

## Desired State
Isolated use cases in `src/core/usecases/` that:
- Accept typed inputs.
- Call port interfaces (not concrete implementations).
- Return typed outputs or throw typed errors.

Core use cases to implement:
- `registerUser`, `verifyUser`, `submitResearch`, `reviewResearch`, `publishResearch`, `uploadResearchFile`, `getResearchByUniversity`, `generateImpactBrief`.

## Success Criteria
- [ ] Every use case has a corresponding unit test in `tests/unit/usecases/`.
- [ ] Unit tests use mock port implementations and do not touch external infrastructure.
- [ ] All business logic is extracted from React components.

## References
- [Refactor Prompt](../../specs/prompt.md#L92-L108)
