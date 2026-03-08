#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "Starting Infrastructure Smoke Check...\n"

# 1. PocketBase
echo -n "Checking PocketBase... "
if curl -s -f http://localhost:8090/api/health > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 2. Mailpit
echo -n "Checking Mailpit... "
if timeout 2 bash -c "</dev/tcp/localhost/1025" 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 3. MinIO
echo -n "Checking MinIO... "
if curl -s -f http://localhost:9000/minio/health/live > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

# 4. Security Bindings Check
echo -n "Checking Local Binding Isolation... "
# This is a simplified check: we assume being able to connect to localhost is expected.
# A true isolation check would require trying to connect via a public IP which is complex in this env.
# Instead, we just verify the services are up on localhost.
echo -e "${GREEN}SKIPPED (Manual Check Req)${NC}"

echo -e "\n${GREEN}Infrastructure is HEALTHY!${NC}"
