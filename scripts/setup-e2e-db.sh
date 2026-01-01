#!/bin/bash
# Setup script for E2E test database
#
# This script:
# 1. Waits for prompt-service to be healthy
# 2. Runs database migrations
# 3. Seeds initial test data
#
# Usage:
#   ./scripts/setup-e2e-db.sh

set -e

echo "=== E2E Test Database Setup ==="

# Configuration
PROMPT_SERVICE_URL="${PROMPT_SERVICE_URL:-http://localhost:3002}"
MAX_RETRIES=30
RETRY_INTERVAL=2

# Wait for prompt-service to be healthy
echo "Waiting for prompt-service at $PROMPT_SERVICE_URL..."
retries=0
until curl -sf "$PROMPT_SERVICE_URL/health" > /dev/null 2>&1; do
  retries=$((retries + 1))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "Error: prompt-service not healthy after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "  Attempt $retries/$MAX_RETRIES - waiting ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "prompt-service is healthy!"

# Run migrations on test database
echo "Running database migrations..."
docker exec votive-prompt-service-test npx prisma migrate deploy

# Seed test data
echo "Seeding test data..."
docker exec votive-prompt-service-test node dist/prisma/seed.js || true

echo ""
echo "=== E2E Test Database Setup Complete ==="
echo ""
echo "You can now run E2E tests:"
echo "  npm run test:e2e"
