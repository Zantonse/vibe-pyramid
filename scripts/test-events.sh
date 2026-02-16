#!/bin/bash
# Sends a sequence of test hook events to the Pyramid server
PORT="${PYRAMID_PORT:-4200}"
URL="http://localhost:${PORT}/event"

echo "Sending test events to ${URL}..."

# Session start
curl -s -X POST "$URL" -H "Content-Type: application/json" \
  -d '{"hook_event_name":"SessionStart","session_id":"demo-session-1","cwd":"/project"}'
sleep 0.5

# A series of tool calls
TOOLS=("Read" "Read" "Grep" "Edit" "Write" "Bash" "Edit" "Write" "Read" "WebFetch" "Edit" "Write" "Write" "Bash" "Task")

for tool in "${TOOLS[@]}"; do
  echo "  -> $tool"
  curl -s -X POST "$URL" -H "Content-Type: application/json" \
    -d "{\"hook_event_name\":\"PostToolUse\",\"session_id\":\"demo-session-1\",\"tool_name\":\"${tool}\",\"tool_input\":{\"file_path\":\"src/example.ts\"}}"
  sleep 1
done

echo ""
echo "Done! Check the visualization."
