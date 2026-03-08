# Specification: Docker Environment

## Metadata
- **ID**: spec-2026-03-08-docker-env
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
The development environment needs to be fully containerized and include local infrastructure for email testing and file storage to ensure a production-parity MVP.

## Desired State
A containerized stack using Docker Compose as the single source of truth for all environments.
- **Services**: 
  - `pocketbase`: Data, auth, and file metadata.
  - `mailpit`: Fake SMTP server (port 1025) and Web UI (port 8025) for local email testing.
  - `minio`: S3-compatible storage (port 9000/9001) for actual file persistence.
  - `app`: Vite dev server (port 5173).
- **Environment Strategy**: Use `.env.local` for local secrets and `.env.production` for prod secrets. Use `.env.example` as a template.
- **Profiles**: Use `docker compose --profile dev up` to include Mailpit and MinIO during development.

## Success Criteria
- [ ] `docker-compose.yml` includes `pocketbase`, `mailpit`, and `minio`.
- [ ] `mailpit` Web UI is accessible at `localhost:8025`.
- [ ] `minio` Console is accessible at `localhost:9001`.
- [ ] App resolves SMTP to `mailpit:1025` with no auth in dev.
- [ ] Files are stored in MinIO and metadata in PocketBase.

## References
- [Refactor Prompt 3](../../specs/prompt3.md)
