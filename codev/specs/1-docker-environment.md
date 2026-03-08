# Specification: Docker Environment

## Metadata
- **ID**: spec-2026-03-08-docker-env
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
The development environment needs to be fully containerized and include local infrastructure for email testing and file storage to ensure a production-parity MVP with robust data persistence.

## Desired State
A containerized stack using Docker Compose as the single source of truth for all environments.
- **Environment Delineation**:
  - `Base`: `pocketbase` (API/Admin), `app` (Vite).
  - `Dev Profile`: `mailpit` (SMTP), `minio` (S3). Enabled via `docker compose --profile dev up`.
- **Services**: 
  - `pocketbase`: Data and auth. Uses named volume `pb_data` for persistence.
  - `mailpit`: SMTP server (`127.0.0.1:1025`) and Web UI (`127.0.0.1:8025`).
  - `minio`: S3 storage. Uses named volume `minio_data`. Requires root credentials and a `research-docs` bucket.
- **Security**: 
  - Local-only UI services (Mailpit, MinIO Console) MUST bind to `127.0.0.1`.
  - `.env.production` MUST NOT be committed to git.
  - `.env.example` must contain templates for all infrastructure credentials.

## Success Criteria
- [x] `docker-compose.yml` uses named volumes for `pocketbase` and `minio`.
- [x] Mailpit and MinIO UI are restricted to `localhost` via explicit IP binding.
- [x] A `research-docs` bucket is automatically initialized on MinIO startup.
- [x] `.env.production` is present in `.gitignore`.

## References
- [Refactor Prompt 3](../../specs/prompt3.md)
- [Codex Review Findings](../../consult_codex.log)
