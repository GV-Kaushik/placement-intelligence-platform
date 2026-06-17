#!/bin/bash
# Register a user
RES=$(curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"testuser", "email":"test_submit@example.com", "password":"password123"}')
TOKEN=$(echo $RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  # Maybe already registered, try login
  RES=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test_submit@example.com", "password":"password123"}')
  TOKEN=$(echo $RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
fi

echo "Token: $TOKEN"

# Submit Experience
curl -s -X POST http://localhost:5000/api/experiences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Oracle",
    "role": "SDE",
    "result": "Selected",
    "rounds": [{"round_name":"OA", "content":"good"}],
    "questions": []
  }'
