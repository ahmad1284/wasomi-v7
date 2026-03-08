# Specification: Refactor Architecture and Layering

## Metadata
- **ID**: spec-2026-03-06-arch-layering
- **Status**: draft
- **Created**: 2026-03-06

## Problem Statement
The current codebase has outgrown its structure, leading to tangled concerns where UI, business logic, and data fetching are often co-located. This makes it difficult to maintain, extend, and onboard new developers.

## Desired State
A strict layered architecture (Clean Architecture) where every layer has a single responsibility.
1. **core/**: Framework-agnostic business logic (domain, usecases, ports).
2. **infrastructure/**: External dependencies (PocketBase, Resend, Gemini).
3. **application/**: React-specific wiring (hooks, context, store).
4. **ui/**: Purely presentational components, layouts, pages, and primitives.

## Success Criteria
- [ ] `ARCHITECTURE.md` exists and covers layering, data flow, and conventions.
- [ ] Project folder structure strictly follows the specified layout.
- [ ] Circular imports between layers are eliminated.
- [ ] `core/` has zero dependencies on React or infrastructure libraries.

## Constraints
- **Role/Permission Logic**: Must be structurally relocated but preserve exact existing behavior.
- **Gemini Integration**: Must be moved to infrastructure but preserve existing behavior.
- **Visual Design**: Must not change.

## References
- [Refactor Prompt](../../specs/prompt.md)
