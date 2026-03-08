# Specification: Refactor Domain Model

## Metadata
- **ID**: spec-2026-03-06-domain-model
- **Status**: draft
- **Created**: 2026-03-06

## Problem Statement
The application lacks a centralized, explicitly typed domain model. Types are often inferred from API responses or scattered across components, leading to type safety gaps (`any` usage) and inconsistent entity structures.

## Desired State
A complete domain model defined in `src/core/domain/` including:
- **Entities**: `User`, `Research`, `Notification`, `AuditLog`, `University`, `Supervisor`.
- **Role System**: Consolidated in `core/domain/roles.ts`.
- **Permission Logic**: Pure functions in `core/usecases/permissions.ts`.

## Success Criteria
- [ ] Every entity has a base type, creation input type, update input type, and result type.
- [ ] No usage of `any`.
- [ ] `ResearchStatus` is a discriminated union.
- [ ] Permission logic is purely functional and behaviorally identical to existing logic.

## References
- [Refactor Prompt](../../specs/prompt.md#L80-L90)
