# Specification: Integrated Testing Strategy

## Metadata
- **ID**: spec-2026-03-08-testing-strategy
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
The application lacks a comprehensive testing strategy that covers critical role-driven workflows and verifies backend integration, specifically transactional emails and file storage.

## Desired State
An integration test suite that runs against a real PocketBase, MinIO, and Mailpit stack in Docker.
- **Infrastructure Smoke Tests**: A dedicated script (e.g., `scripts/smoke-check.sh`) must exist to verify:
  - PocketBase is responding to health checks.
  - MinIO is writable (test file upload).
  - Mailpit is reachable (test email send via SMTP).
- **Functional Coverage**: Auth flows, research submission, approval, publication, and notification triggers.
- **Email Assertions**: Use Mailpit's REST API (`/api/v1/messages`) to verify that the correct emails were "sent" with the expected content.
- **Storage Assertions**: Verify that uploaded files are correctly stored in MinIO and accessible.

## Success Criteria
- [ ] `scripts/smoke-check.sh` exists and passes.
- [ ] Integration tests cover the full research lifecycle (Student -> Supervisor -> Admin).
- [ ] Email delivery is verified via Mailpit REST API.
- [ ] File accessibility is verified via MinIO storage checks.

## References
- [Refactor Prompt 2](../../specs/prompt2.md#L97-L120)
- [Refactor Prompt 3](../../specs/prompt3.md)
- [Codex Review Findings](../../consult_codex.log)
