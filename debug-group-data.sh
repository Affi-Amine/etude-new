#!/bin/bash
# Debug script to check group data structure

echo "🔍 Fetching groups data..."

# Read cookies from file
if [ ! -f "cookies.txt" ]; then
    echo "❌ cookies.txt file not found"
    exit 1
fi

cookies=$(cat cookies.txt)

# Make API request
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -H "Cookie: $cookies" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/groups")

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

if [ $http_code -ne 200 ]; then
    echo "❌ API Error: HTTP $http_code"
    echo "Response: $body"
    exit 1
fi

echo "✅ Groups fetched successfully"
echo "📊 Response data:"
echo "$body" | jq .

echo "\n📋 Analyzing first group structure:"
echo "$body" | jq '.[0] // "No groups found"'