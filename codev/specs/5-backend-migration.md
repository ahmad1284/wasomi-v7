# Specification: Backend Migration (Data & Auth)

## Metadata
- **ID**: spec-2026-03-08-backend-migration
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
The application currently relies on `localStorage` mocks in `store.ts` for data persistence and authentication. This prevents collaborative workflows and multi-device access required for the MVP.

## Desired State
A fully functional data layer integrated with the React application, transitioning from local mocks to PocketBase.
- **Auth Transition**: Replace `mockAuth` with PocketBase SDK authentication. Handle auto-login on page refresh.
- **Data Persistence**: Migrate all collections (`User`, `Research`, `AuditLog`, `Notification`) from `store.ts` mocks to PocketBase real-time collections.
- **Clean Slate**: Completely remove all `localStorage` logic and Supabase-related comments/code.
- **Transactional Consistency**: Ensure that research submissions and status updates result in atomicity between database writes and notifications.

## Success Criteria
- [ ] `store.ts` uses PocketBase SDK for all CRUD operations.
- [ ] Authentication is managed via PocketBase `authStore`.
- [ ] Research files are uploaded to the `research` collection's file field.
- [ ] All `localStorage` references are purged from the project.

## References
- [Refactor Prompt 2](../../specs/prompt2.md#L31-L65)