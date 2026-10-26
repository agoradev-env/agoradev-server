#!/bin/bash

# Agora API Testing Script
# Alternative to Postman for testing endpoints

BASE_URL="http://localhost:3000/api/v1"

echo "=========================================="
echo "Agora API Testing Script"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | jq '.'
echo ""
echo ""

# Test 2: Database Health Check
echo -e "${YELLOW}Test 2: Database Health Check${NC}"
curl -s "$BASE_URL/health/database" | jq '.'
echo ""
echo ""

# Test 3: Sign Up
echo -e "${YELLOW}Test 3: Sign Up${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123"
  }')
echo "$SIGNUP_RESPONSE" | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.refreshToken')

echo ""
echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"
echo ""
echo ""

# Test 4: Login
echo -e "${YELLOW}Test 4: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
echo ""
echo ""

# Test 5: Forgot Password
echo -e "${YELLOW}Test 5: Forgot Password${NC}"
curl -s -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }' | jq '.'
echo ""
echo ""

# Test 6: Refresh Token
echo -e "${YELLOW}Test 6: Refresh Token${NC}"
curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq '.'
echo ""
echo ""

# Test 7: Logout (Protected)
echo -e "${YELLOW}Test 7: Logout (Protected - requires JWT)${NC}"
curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""
echo ""

echo -e "${GREEN}=========================================="
echo "All tests completed!"
echo "==========================================${NC}"
