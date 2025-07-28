#!/bin/bash
# Test authentication status

echo "🔍 Testing authentication..."

# Read cookies from file
if [ ! -f "cookies.txt" ]; then
    echo "❌ cookies.txt file not found"
    exit 1
fi

cookies=$(cat cookies.txt)
echo "📋 Using cookies: $cookies"

# Test session endpoint first
echo "\n🔐 Testing session endpoint..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -H "Cookie: $cookies" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/auth/session")

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

echo "Session API Status: $http_code"
echo "Session Response: $body"

if [ $http_code -eq 200 ]; then
    echo "\n✅ Authentication successful, now testing groups API..."
    
    # Test groups endpoint
    groups_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
      -H "Cookie: $cookies" \
      -H "Content-Type: application/json" \
      "http://localhost:3000/api/groups")
    
    groups_http_code=$(echo $groups_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    groups_body=$(echo $groups_response | sed -e 's/HTTPSTATUS:.*//g')
    
    echo "Groups API Status: $groups_http_code"
    echo "Groups Response: $groups_body"
else
    echo "❌ Authentication failed"
fi