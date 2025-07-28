#!/bin/bash

echo "🔍 Testing Groups API..."

# Test groups endpoint
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -H "Cookie: next-auth.callback-url=http%3A%2F%2Flocalhost%3A3000; next-auth.csrf-token=7f3e3f4e560352014ca571f98dd260422e29def078d84a672e33f4affd58be92%7Cea2a96d9d6716bf771b3acdb1d1919b576b3eb46dab698241a409b251e3b5a73" \
  "http://localhost:3000/api/groups")

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

echo "Status: $http_code"
echo "Response: $body"

if [ $http_code -eq 200 ]; then
    echo "✅ API is working!"
else
    echo "❌ API Error: HTTP $http_code"
fi