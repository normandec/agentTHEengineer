#!/usr/bin/env bash
# Minimal public API smoke test. Use: CR_API=https://... ./tools/smoke.sh
set -Eeuo pipefail

API="${CR_API:-${1:-}}"
if [[ -z "$API" ]]; then
  echo "Usage: CR_API=https://PROJECT.supabase.co/functions/v1/classroom $0" >&2
  exit 2
fi
API="${API%/}"

echo "== health =="
health="$(curl --fail-with-body --silent --show-error "$API/health")"
printf '%s\n' "$health"
printf '%s' "$health" | grep -q '"ok":true'

echo "== prompt size =="
prompt_chars="$(curl --fail-with-body --silent --show-error "$API/prompt" | wc -c | tr -d ' ')"
echo "$prompt_chars characters"
[[ "$prompt_chars" -le 9000 ]]

echo "== rules =="
curl --fail-with-body --silent --show-error "$API/rules" | grep -qi 'honest'

echo "== create session + sheet =="
session="$(curl --fail-with-body --silent --show-error -X POST "$API/session" -H 'content-type: application/json' -d '{"title":"smoke test"}')"
printf '%s\n' "$session"
if command -v python3 >/dev/null; then
  SID="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["session_id"])' <<<"$session")"
  SHEET="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["sheet_id"])' <<<"$session")"
else
  SID="$(sed -nE 's/.*"session_id":"([^"]+)".*/\1/p' <<<"$session")"
  SHEET="$(sed -nE 's/.*"sheet_id":"([^"]+)".*/\1/p' <<<"$session")"
fi
[[ -n "$SID" && -n "$SHEET" ]]

curl --fail-with-body --silent --show-error -X POST "$API/sheet/$SHEET/ops" \
  -H 'content-type: application/json' \
  -d '{"ops":[{"t":"path","pts":[[40,40],[100,75],[170,45]],"w":4,"c":"#1a73e8","close":false}]}' >/dev/null
curl --fail-with-body --silent --show-error "$API/sheet/$SHEET/ops?since=0" | grep -q '"path"'

echo "Smoke test passed for session $SID."
