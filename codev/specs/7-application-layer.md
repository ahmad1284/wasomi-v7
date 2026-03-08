# Specification: Refactor Application Layer

## Metadata
- **ID**: spec-2026-03-06-application-layer
- **Status**: draft
- **Created**: 2026-03-06

## Problem Statement
Application-wide state (Auth, Notifications) and side-effect handling are often interleaved with UI components, making the UI harder to test and the state logic harder to reason about.

## Desired State
A clean application layer in `src/application/` consisting of:
- **Hooks**: Thin wrappers in `src/application/hooks/` (one per use case) that manage loading, error, and success states.
- **Context**: Global state providers in `src/application/context/` for Auth and Notifications.
- **Store**: Client-side state that is not server-state.

## Success Criteria
- [ ] Auth context handles all PocketBase interactions (login, logout, register, current user).
- [ ] Hooks manage use-case state consistently (loading, data, error).
- [ ] Components only interact with hooks or context, never with use cases or infrastructure directly.

## References
- [Refactor Prompt](../../specs/prompt.md#L122-L132)
