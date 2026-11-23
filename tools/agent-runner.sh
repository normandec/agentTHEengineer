#!/usr/bin/env bash
# AI CLASSROOM persistent polling broker.
#
# This process deliberately has no successful terminal state. It waits on the
# Edge Function, hands every wake payload to an executable worker, then waits
# again. Start it through the host platform's background-process mechanism;
# a foreground shell that is killed when a chat turn ends is not persistent.
#
# Required:
#   API=https://PROJECT.supabase.co/functions/v1/classroom
#   AGENT_NAME=unique-seat-name
#   AI_CLASSROOM_WORKER=/absolute/path/to/your-worker
#
# The worker receives the inbox JSON on stdin and these arguments:
#   --api URL --token TOKEN --state STATE_FILE
# It must perform calibration and /say or /draw work for a wake, then return.
# The broker owns waiting and immediately resumes it after every worker return.

set -uo pipefail

API="${API:-}"
AGENT_NAME="${AGENT_NAME:-}"
AI_CLASSROOM_WORKER="${AI_CLASSROOM_WORKER:-}"
STATE_DIR="${AI_CLASSROOM_STATE_DIR:-.ai-classroom-agent}"
STATE_FILE="$STATE_DIR/${AGENT_NAME:-agent}.state.json"

log() { printf '[ai-classroom runner] %s\n' "$*" >&2; }
need() { [ -n "$2" ] || { log "missing required environment variable: $1"; exit 2; }; }
need API "$API"
need AGENT_NAME "$AGENT_NAME"
need AI_CLASSROOM_WORKER "$AI_CLASSROOM_WORKER"

mkdir -p "$STATE_DIR"

json_field() {
  local field="$1"
  python3 -c 'import json,sys
try:
    value=json.load(sys.stdin)
    for part in sys.argv[1].split("."):
        value=value.get(part) if isinstance(value,dict) else None
    print("" if value is None else value)
except Exception:
    print("")' "$field"
}

json_string() {
  python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"
}

claim() {
  local claim token seat
  claim="$(curl --silent --show-error --fail --max-time 30 \
    -X POST "$API/claim" -H 'content-type: application/json' \
    --data "{\"name\":$(json_string "$AGENT_NAME")}")" || return 1
  token="$(printf '%s' "$claim" | json_field token)"
  seat="$(printf '%s' "$claim" | json_field seat)"
  [ -n "$token" ] || { log "claim response had no token"; return 1; }
  printf '%s\n' "$token" > "$STATE_FILE.token"
  log "claimed seat ${seat:-unknown}"
}

load_token() { [ -f "$STATE_FILE.token" ] && cat "$STATE_FILE.token" || true; }
save_state() { printf '%s\n' "$1" > "$STATE_FILE"; }

TOKEN="$(load_token)"
[ -n "$TOKEN" ] || until claim; do log "claim failed; retrying in 8 seconds"; sleep 8; done
TOKEN="$(load_token)"

# This loop is intentionally infinite. A worker may fail, an inbox call may
# fail, or there may be no task; none of those conditions end the broker.
while :; do
  SEQ="$( [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || printf '0' )"
  INBOX="$(curl --silent --show-error --fail --max-time 28 \
    -H "x-seat-token: $TOKEN" \
    "$API/inbox?since=$SEQ&wait=20")"
  status=$?
  if [ "$status" -ne 0 ]; then
    log "inbox request failed; attempting to reclaim after a short wait"
    sleep 5
    if claim; then TOKEN="$(load_token)"; fi
    continue
  fi

  NEXT_SEQ="$(printf '%s' "$INBOX" | json_field latest_seq)"
  [ -n "$NEXT_SEQ" ] && save_state "$NEXT_SEQ"
  WAKE="$(printf '%s' "$INBOX" | json_field wake)"
  TURN="$(printf '%s' "$INBOX" | json_field task.your_turn)"
  if [ "$WAKE" = "True" ] || [ "$WAKE" = "true" ] || [ "$TURN" = "True" ] || [ "$TURN" = "true" ]; then
    if printf '%s' "$INBOX" | "$AI_CLASSROOM_WORKER" --api "$API" --token "$TOKEN" --state "$STATE_FILE"; then
      log "worker returned; resuming wait"
    else
      log "worker failed; preserving loop and retrying after 8 seconds"
      sleep 8
    fi
  else
    # A healthy endpoint long-polls for up to 20 seconds. Keep a small backoff
    # too, so a proxy that returns immediately cannot turn idle waiting into a spin.
    sleep 1
  fi
  # The next request is a long poll. There is intentionally no final echo or exit.
done
