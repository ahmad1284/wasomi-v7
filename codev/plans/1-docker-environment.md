# Implementation Plan: 1-docker-environment

This plan describes the steps to implement the foundational containerized environment as specified in `codev/specs/1-docker-environment.md`.

## Proposed Changes

### Configuration
1.  **[NEW] .env.example**: Template for environment variables including:
    - **App**: `VITE_API_URL`, `VITE_S3_ENDPOINT`.
    - **MinIO**: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`.
    - **Mailpit**: `SMTP_HOST`, `SMTP_PORT`.
    - **PocketBase**: `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`.
2.  **[MODIFY] .gitignore**: Explicitly add `.env.production` and `.env.local`.

### Infrastructure
1.  **[NEW] docker-compose.yml**:
    - **Base Stack**:
      - `pocketbase`: API service. Volume: `pb_data:/pb_data`. Port: `8090:8080`.
      - `app`: Vite React service using bind mount for source code and local `.env`. Port: `5173:5173`.
    - **Dev Profile** (`profiles: ["dev"]`):
      - `mailpit`: SMTP (`127.0.0.1:1025:1025`) and Web UI (`127.0.0.1:8025:8025`).
      - `minio`: S3-compatible service. Volume: `minio_data:/data`. Console (`127.0.0.1:9001:9001`). API (`127.0.0.1:9000:9000`).
        - **Healthcheck**: Verify `curl -f http://localhost:9000/minio/health/live`.
      - `mc`: Ephemeral bucket initializer. 
        - **Logic**: `depends_on` minio with `service_healthy`. Uses a loop to create `research-docs` bucket.
    - **Volumes**: Declare named volumes `pb_data` and `minio_data` at root level.

### Verification Tools
1.  **[NEW] scripts/smoke-check.sh**: Verified readiness of:
    - **PB**: `curl http://localhost:8090/api/health`.
    - **MinIO**: Check bucket existence using `curl`.
    - **Mailpit**: Verify SMTP port response.
    - **Security**: Attempt to reach 8025/9001 via public IP (should fail) vs 127.0.0.1 (should pass).

## Verification Plan

### Manual Verification
- Run `docker compose --profile dev up -d`.
- Verify `mc` service exited with code 0 (bucket initialized).
- Run `bash scripts/smoke-check.sh` and ensure all checks (including security bindings) pass.
