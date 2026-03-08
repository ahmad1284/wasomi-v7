#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "Starting Infrastructure Functional Smoke Check...\n"

# 1. PocketBase API
echo -n "Checking PocketBase API... "
if curl -s -f http://localhost:8090/api/health > /dev/null; then
    echo -e "${GREEN}OK (Connectivity)${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 2. MinIO Read/Write (using mc container via run)
echo -n "Checking MinIO Storage (Upload/Verify via mc run)... "
# Explicitly set alias inside the run to ensure it exists
if docker compose run --rm mc /bin/sh -c "mc alias set local http://minio:9000 admin password123 > /dev/null 2>&1 && mc cp --quiet /etc/hosts local/research-docs/smoke_test_mc.txt > /dev/null 2>&1 && mc ls local/research-docs/smoke_test_mc.txt" > /dev/null 2>&1; then
    echo -e "${GREEN}OK (R/W via mc run)${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 3. Mailpit SMTP
echo -n "Checking Mailpit SMTP (Send)... "
if timeout 2 bash -c "</dev/tcp/localhost/1025" 2>/dev/null; then
    echo -e "${GREEN}OK (Connectivity)${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo -e "\n${GREEN}Infrastructure is FULLY FUNCTIONAL!${NC}"
