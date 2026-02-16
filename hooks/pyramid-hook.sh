#!/bin/bash
# Pyramid hook — receives Claude Code events and forwards to the Pyramid server.
# Reads JSON from stdin, POSTs to the local server.

set -euo pipefail

PYRAMID_PORT="${PYRAMID_PORT:-4200}"
PYRAMID_URL="http://localhost:${PYRAMID_PORT}/event"

# Read all stdin
INPUT=$(cat)

# Find curl
CURL=$(command -v curl 2>/dev/null || echo "")
if [ -z "$CURL" ]; then
  exit 0
fi

# Fire-and-forget POST to the server
$CURL -s -o /dev/null --max-time 2 \
  -X POST "$PYRAMID_URL" \
  -H "Content-Type: application/json" \
  -d "$INPUT" &>/dev/null || true

exit 0
