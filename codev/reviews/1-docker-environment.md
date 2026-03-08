# Review: 1-docker-environment

## Summary
The foundational containerized stack for Wasomi Scholars has been implemented following Specification 1 and Implementation Plan 1.

## Implementation Details
- **Architecture**: Separated core services (PocketBase, App) from dev tools (Mailpit, MinIO) using Docker profiles.
- **Security**: Local UI/API ports are bound to `127.0.0.1` to prevent exposure.
- **Persistence**: Named volumes `pb_data` and `minio_data` are configured.
- **Automation**: Ephemeral `mc` container handles idempotent bucket creation.

## Verification Results
- **scripts/smoke-check.sh**: Passed all connectivity and security checks.
- **Docker Compose**: Validated config for profile and dependency logic.
- **Port Conflict**: Resolved an initial conflict on port 5173 by moving the app to 5174.

## Lessons Learned
- The `muchobien/pocketbase` image is hosted on GHCR (`ghcr.io`), which requires explicit registry awareness or standard image naming in compose.
- Internal container ports for PocketBase default to 8090 in some community images; verified and matched host/target ports.
