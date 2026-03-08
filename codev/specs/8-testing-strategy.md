# Specification: Integrated Testing Strategy

## Metadata
- **ID**: spec-2026-03-08-testing-strategy
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
The application lacks a comprehensive testing strategy that covers critical role-driven workflows and verifies backend integration, specifically transactional emails and file storage.

## Desired State
An integration test suite that runs against a real PocketBase, MinIO, and Mailpit stack in Docker.
- **Coverage**: Auth flows, research submission, approval, publication, and notification triggers.
- **Email Assertions**: Use Mailpit's REST API (`/api/v1/messages`) to verify that the correct emails were "sent" to the correct recipients with the expected body content.
- **Storage Assertions**: Verify that uploaded files are correctly stored in MinIO and accessible via signed URLs.
- **Isolation**: Automatic seeding and teardown of fixtures before/after test runs using Docker Compose profiles.

## Success Criteria
- [ ] Integration tests cover the full research lifecycle (Student -> Supervisor -> Admin).
- [ ] Notification tests assert on `notifications` collection writes.
- [ ] Email delivery is verified via Mailpit REST API.
- [ ] File accessibility is verified via MinIO storage checks.

## References
- [Refactor Prompt 2](../../specs/prompt2.md#L97-L120)
- [Refactor Prompt 3](../../specs/prompt3.md)
