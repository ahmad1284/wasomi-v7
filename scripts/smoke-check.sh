#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "Starting Infrastructure Functional Smoke Check...\n"

# Load environment variables for credentials (fallback to defaults if .env.local missing)
[ -f .env.local ] && source .env.local
USER=${MINIO_ROOT_USER:-admin}
PASS=${MINIO_ROOT_PASSWORD:-password123}
BUCKET=${S3_BUCKET:-research-docs}

# 1. PocketBase API
echo -n "Checking PocketBase API (Local)... "
if curl -s -f http://127.0.0.1:8090/api/health > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 2. MinIO Read/Write (using dev profile run)
echo -n "Checking MinIO Storage (Upload/Verify via mc)... "
if docker compose --profile dev run --rm mc /bin/sh -c "mc alias set local http://minio:9000 $USER $PASS > /dev/null 2>&1 && mc cp --quiet /etc/hosts local/$BUCKET/smoke_test_mc.txt > /dev/null 2>&1 && mc ls local/$BUCKET/smoke_test_mc.txt" > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 3. Mailpit SMTP
echo -n "Checking Mailpit SMTP (Connectivity)... "
if timeout 2 bash -c "</dev/tcp/127.0.0.1/1025" 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 4. Security Bindings Check (Preventing Public Exposure)
echo -n "Checking Security Isolation (Local-only UI)... "
# We specifically check Mailpit UI (8025) and MinIO Console (9001)
# Use awk to check the Local Address column (4th column)
if netstat -tuln | grep -P ":(8025|9001) " | awk '{print $4}' | grep -qE "^0\.0\.0\.0|^\:\:\:"; then
    echo -e "${RED}FAILED (Exposed to 0.0.0.0 or :::)${NC}"
    exit 1
else
    echo -e "${GREEN}OK (Bound to localhost)${NC}"
fi

echo -e "\n${GREEN}Infrastructure is SECURE and FULLY FUNCTIONAL!${NC}"
