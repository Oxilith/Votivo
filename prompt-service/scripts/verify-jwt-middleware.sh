#!/bin/bash
# JWT Middleware Verification Script
# This script verifies that JWT authentication middleware correctly protects routes
#
# Verification Steps:
# 1. POST /api/user-auth/login - get access token
# 2. Use existing protected endpoint (/api/user-auth/me) with JWT middleware
# 3. Access endpoint without token - should return 401
# 4. Access endpoint with valid token - should return 200
# 5. Access endpoint with invalid/tampered token - should return 401

set -e

BASE_URL="${BASE_URL:-http://localhost:3002}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="jwt-test-${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"

echo "=============================================="
echo "JWT Middleware Verification Script"
echo "=============================================="
echo "Base URL: ${BASE_URL}"
echo "Test Email: ${TEST_EMAIL}"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

check_result() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local response_body="$4"

    if [ "$actual_status" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC}: $test_name (status: $actual_status)"
        ((pass_count++))
        return 0
    else
        echo -e "${RED}FAIL${NC}: $test_name"
        echo "  Expected: $expected_status"
        echo "  Actual: $actual_status"
        echo "  Response: $response_body"
        ((fail_count++))
        return 1
    fi
}

echo "----------------------------------------------"
echo "Step 1: Register a test user"
echo "----------------------------------------------"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/api/user-auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)

if [ "$REGISTER_STATUS" -eq 201 ]; then
    echo -e "${GREEN}User registered successfully${NC}"
    ACCESS_TOKEN=$(echo "$REGISTER_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ACCESS_TOKEN" ]; then
        echo "Access token obtained from registration"
    fi
else
    echo -e "${YELLOW}Registration may have failed (status: $REGISTER_STATUS)${NC}"
    echo "Response: $REGISTER_BODY"
    echo "Trying to login with existing user..."
fi

echo ""
echo "----------------------------------------------"
echo "Step 2: Login to get access token"
echo "----------------------------------------------"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/api/user-auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)

if [ "$LOGIN_STATUS" -eq 200 ]; then
    echo -e "${GREEN}Login successful${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ACCESS_TOKEN" ]; then
        echo "Access token: ${ACCESS_TOKEN:0:50}..."
    else
        echo -e "${RED}Failed to extract access token from response${NC}"
        echo "Response: $LOGIN_BODY"
        exit 1
    fi
else
    echo -e "${RED}Login failed (status: $LOGIN_STATUS)${NC}"
    echo "Response: $LOGIN_BODY"
    exit 1
fi

echo ""
echo "----------------------------------------------"
echo "Step 3: Access protected endpoint WITHOUT token"
echo "----------------------------------------------"
echo "Endpoint: GET /api/user-auth/me"
echo "Expected: 401 Unauthorized with code NO_TOKEN"

NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${BASE_URL}/api/user-auth/me")

NO_TOKEN_BODY=$(echo "$NO_TOKEN_RESPONSE" | head -n -1)
NO_TOKEN_STATUS=$(echo "$NO_TOKEN_RESPONSE" | tail -n 1)

check_result "Protected route without token returns 401" 401 "$NO_TOKEN_STATUS" "$NO_TOKEN_BODY"

# Check for NO_TOKEN error code
if echo "$NO_TOKEN_BODY" | grep -q '"code":"NO_TOKEN"'; then
    echo -e "${GREEN}PASS${NC}: Response contains correct error code 'NO_TOKEN'"
    ((pass_count++))
else
    echo -e "${RED}FAIL${NC}: Response should contain error code 'NO_TOKEN'"
    echo "  Response: $NO_TOKEN_BODY"
    ((fail_count++))
fi

echo ""
echo "----------------------------------------------"
echo "Step 4: Access protected endpoint WITH valid token"
echo "----------------------------------------------"
echo "Endpoint: GET /api/user-auth/me"
echo "Expected: 200 OK with user data"

VALID_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${BASE_URL}/api/user-auth/me" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

VALID_TOKEN_BODY=$(echo "$VALID_TOKEN_RESPONSE" | head -n -1)
VALID_TOKEN_STATUS=$(echo "$VALID_TOKEN_RESPONSE" | tail -n 1)

check_result "Protected route with valid token returns 200" 200 "$VALID_TOKEN_STATUS" "$VALID_TOKEN_BODY"

# Check that response contains user data
if echo "$VALID_TOKEN_BODY" | grep -q '"email"'; then
    echo -e "${GREEN}PASS${NC}: Response contains user data with email"
    ((pass_count++))
else
    echo -e "${RED}FAIL${NC}: Response should contain user email"
    echo "  Response: $VALID_TOKEN_BODY"
    ((fail_count++))
fi

# Check that password is not in response
if echo "$VALID_TOKEN_BODY" | grep -q '"password"'; then
    echo -e "${RED}FAIL${NC}: Response should NOT contain password"
    ((fail_count++))
else
    echo -e "${GREEN}PASS${NC}: Response correctly excludes password"
    ((pass_count++))
fi

echo ""
echo "----------------------------------------------"
echo "Step 5: Access protected endpoint with INVALID token"
echo "----------------------------------------------"
echo "Endpoint: GET /api/user-auth/me"
echo "Expected: 401 Unauthorized with code INVALID_TOKEN"

INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlLXVzZXItaWQiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjQwMDAwMDAwfQ.invalid_signature"

INVALID_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${BASE_URL}/api/user-auth/me" \
    -H "Authorization: Bearer ${INVALID_TOKEN}")

INVALID_TOKEN_BODY=$(echo "$INVALID_TOKEN_RESPONSE" | head -n -1)
INVALID_TOKEN_STATUS=$(echo "$INVALID_TOKEN_RESPONSE" | tail -n 1)

check_result "Protected route with invalid token returns 401" 401 "$INVALID_TOKEN_STATUS" "$INVALID_TOKEN_BODY"

# Check for INVALID_TOKEN error code
if echo "$INVALID_TOKEN_BODY" | grep -q '"code":"INVALID_TOKEN"'; then
    echo -e "${GREEN}PASS${NC}: Response contains correct error code 'INVALID_TOKEN'"
    ((pass_count++))
else
    echo -e "${RED}FAIL${NC}: Response should contain error code 'INVALID_TOKEN'"
    echo "  Response: $INVALID_TOKEN_BODY"
    ((fail_count++))
fi

echo ""
echo "----------------------------------------------"
echo "Step 6: Access protected endpoint with MALFORMED token"
echo "----------------------------------------------"
echo "Endpoint: GET /api/user-auth/me"
echo "Expected: 401 Unauthorized"

MALFORMED_TOKEN="not-a-valid-jwt-token"

MALFORMED_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${BASE_URL}/api/user-auth/me" \
    -H "Authorization: Bearer ${MALFORMED_TOKEN}")

MALFORMED_TOKEN_BODY=$(echo "$MALFORMED_TOKEN_RESPONSE" | head -n -1)
MALFORMED_TOKEN_STATUS=$(echo "$MALFORMED_TOKEN_RESPONSE" | tail -n 1)

check_result "Protected route with malformed token returns 401" 401 "$MALFORMED_TOKEN_STATUS" "$MALFORMED_TOKEN_BODY"

echo ""
echo "----------------------------------------------"
echo "Step 7: Access protected endpoint with WRONG Authorization format"
echo "----------------------------------------------"
echo "Endpoint: GET /api/user-auth/me"
echo "Expected: 401 Unauthorized (not a Bearer token)"

WRONG_FORMAT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${BASE_URL}/api/user-auth/me" \
    -H "Authorization: Basic ${ACCESS_TOKEN}")

WRONG_FORMAT_BODY=$(echo "$WRONG_FORMAT_RESPONSE" | head -n -1)
WRONG_FORMAT_STATUS=$(echo "$WRONG_FORMAT_RESPONSE" | tail -n 1)

check_result "Protected route with wrong auth format returns 401" 401 "$WRONG_FORMAT_STATUS" "$WRONG_FORMAT_BODY"

echo ""
echo "----------------------------------------------"
echo "Step 8: Access another protected endpoint (logout-all)"
echo "----------------------------------------------"
echo "Endpoint: POST /api/user-auth/logout-all"
echo "Testing that JWT middleware works on multiple routes"

# Without token
LOGOUT_NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/api/user-auth/logout-all")

LOGOUT_NO_TOKEN_BODY=$(echo "$LOGOUT_NO_TOKEN_RESPONSE" | head -n -1)
LOGOUT_NO_TOKEN_STATUS=$(echo "$LOGOUT_NO_TOKEN_RESPONSE" | tail -n 1)

check_result "logout-all without token returns 401" 401 "$LOGOUT_NO_TOKEN_STATUS" "$LOGOUT_NO_TOKEN_BODY"

# With valid token
LOGOUT_WITH_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${BASE_URL}/api/user-auth/logout-all" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")

LOGOUT_WITH_TOKEN_BODY=$(echo "$LOGOUT_WITH_TOKEN_RESPONSE" | head -n -1)
LOGOUT_WITH_TOKEN_STATUS=$(echo "$LOGOUT_WITH_TOKEN_RESPONSE" | tail -n 1)

check_result "logout-all with valid token returns 200" 200 "$LOGOUT_WITH_TOKEN_STATUS" "$LOGOUT_WITH_TOKEN_BODY"

echo ""
echo "=============================================="
echo "JWT Middleware Verification Summary"
echo "=============================================="
echo -e "Passed: ${GREEN}${pass_count}${NC}"
echo -e "Failed: ${RED}${fail_count}${NC}"
echo ""

if [ "$fail_count" -eq 0 ]; then
    echo -e "${GREEN}All JWT middleware verification tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
