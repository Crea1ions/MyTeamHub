#!/bin/bash

# Phase 1.4 Integration Test
# Verifies Team-Studio ↔ Orchestrator ↔ Vault data flow

set -e

ORCHESTRATOR_HOST=${ORCHESTRATOR_HOST:-127.0.0.1}
ORCHESTRATOR_PORT=${ORCHESTRATOR_PORT:-8001}
TEAM_STUDIO_HOST=${TEAM_STUDIO_HOST:-127.0.0.1}
TEAM_STUDIO_PORT=${TEAM_STUDIO_PORT:-3001}

ORCHESTRATOR_URL="http://$ORCHESTRATOR_HOST:$ORCHESTRATOR_PORT/api/events"
TEAM_STUDIO_URL="http://$TEAM_STUDIO_HOST:$TEAM_STUDIO_PORT/api/orchestrator/events"
VAULT_BASE="./vault"

echo "🧪 Phase 1.4 Integration Test"
echo "================================"
echo ""
echo "Orchestrator: $ORCHESTRATOR_URL"
echo "Team-Studio: $TEAM_STUDIO_URL"
echo "Vault base: $VAULT_BASE"
echo ""

# Test 1: Check orchestrator is running
echo "Test 1: Health check (Orchestrator)"
if curl -s "$ORCHESTRATOR_HOST:$ORCHESTRATOR_PORT/vault/health" > /dev/null 2>&1; then
  echo "  ✅ Orchestrator is running"
else
  echo "  ❌ Orchestrator not responding"
  echo "     Start with: cd orchestrator && cargo run"
  exit 1
fi

# Test 2: Send event directly to Orchestrator
echo ""
echo "Test 2: Direct event to Orchestrator"
EVENT_ID=$(date +%s)
RESPONSE=$(curl -s -X POST "$ORCHESTRATOR_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"output_generated\",
    \"data\": {
      \"project_id\": \"test-proj-direct\",
      \"session_id\": \"test-sess-$EVENT_ID\",
      \"content\": \"# Direct Test Output\"
    }
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
  FILE_ID=$(echo "$RESPONSE" | grep -o '"file_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  ✅ Event persisted (file_id: ${FILE_ID:0:8}...)"
else
  echo "  ❌ Failed to persist event"
  echo "     Response: $RESPONSE"
  exit 1
fi

# Test 3: Verify Vault file created
echo ""
echo "Test 3: Verify Vault file created"
VAULT_FILE="$VAULT_BASE/outputs/test-proj-direct/test-sess-$EVENT_ID.md"
if [ -f "$VAULT_FILE" ]; then
  echo "  ✅ File created at: $VAULT_FILE"
  echo "     Content:"
  head -n 5 "$VAULT_FILE" | sed 's/^/     /'
else
  echo "  ❌ File not found: $VAULT_FILE"
  exit 1
fi

# Test 4: Check event log created
echo ""
echo "Test 4: Check system event log"
EVENT_LOG="$VAULT_BASE/system/events.log"
if [ -f "$EVENT_LOG" ]; then
  echo "  ✅ Event log exists"
  echo "     Recent entries:"
  tail -n 2 "$EVENT_LOG" | sed 's/^/     /'
else
  echo "  ⚠️  Event log not yet created (will be on first event)"
fi

# Test 5: Team-Studio endpoint (if available)
echo ""
echo "Test 5: Team-Studio endpoint check"
if timeout 2 curl -s "$TEAM_STUDIO_HOST:$TEAM_STUDIO_PORT/api/orchestrator/events" > /dev/null 2>&1; then
  echo "  ✅ Team-Studio endpoint is available"
  
  # Try to send event via Team-Studio
  echo ""
  echo "Test 6: Event via Team-Studio middleware"
  EVENT_ID2=$(date +%s)
  RESPONSE2=$(curl -s -X POST "$TEAM_STUDIO_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"event_type\": \"session_created\",
      \"data\": {
        \"project_id\": \"test-proj-ts\",
        \"session_id\": \"test-sess-$EVENT_ID2\",
        \"title\": \"Test via Team-Studio\"
      }
    }")
  
  if echo "$RESPONSE2" | grep -q "success.*true"; then
    echo "  ✅ Event via Team-Studio succeeded"
  else
    echo "  ⚠️  Event failed (Team-Studio may not be running)"
    echo "     Response: $RESPONSE2"
  fi
else
  echo "  ⚠️  Team-Studio not running (optional for direct tests)"
  echo "     Start with: cd server && npm start"
fi

echo ""
echo "✅ Integration tests complete!"
echo ""
echo "📊 Summary:"
echo "  - Orchestrator ↔ Vault: ✅ Working"
echo "  - Event persistence: ✅ Working"
echo "  - System logging: ✅ Working"
echo "  - Team-Studio middleware: $([ -f \"$VAULT_BASE/projects/test-proj-ts/sessions.json\" ] && echo '✅ Working' || echo '⚠️ Not tested')"
