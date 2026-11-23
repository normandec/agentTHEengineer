#!/usr/bin/env bash
# Public API smoke test. Use: CR_API=https://... ./tools/smoke.sh
set -Eeuo pipefail

API="${CR_API:-${1:-}}"
if [[ -z "$API" ]]; then echo "Usage: CR_API=https://PROJECT.supabase.co/functions/v1/classroom $0" >&2; exit 2; fi
API="${API%/}"
json_value() { python3 -c "import json,sys; print(json.load(sys.stdin)[sys.argv[1]])" "$1"; }

printf '== health ==\n'
health="$(curl --fail-with-body --silent --show-error "$API/health")"
printf '%s\n' "$health"; printf '%s' "$health" | grep -q '"ok":true'

printf '== prompt and rules ==\n'
prompt_chars="$(curl --fail-with-body --silent --show-error "$API/prompt" | wc -c | tr -d ' ')"
echo "$prompt_chars characters"; [[ "$prompt_chars" -le 9000 ]]
curl --fail-with-body --silent --show-error "$API/rules" | grep -qi 'blocking\|honesty'

printf '== create session + sheet ==\n'
session="$(curl --fail-with-body --silent --show-error -X POST "$API/session" -H 'content-type: application/json' -d '{"title":"smoke test"}')"
printf '%s\n' "$session"
SID="$(printf '%s' "$session" | json_value session_id)"; SHEET="$(printf '%s' "$session" | json_value sheet_id)"
[[ -n "$SID" && -n "$SHEET" ]]

printf '== board op, snapshot and retrieval ==\n'
curl --fail-with-body --silent --show-error -X POST "$API/sheet/$SHEET/ops" -H 'content-type: application/json' \
  -d '{"ops":[{"t":"path","pts":[[40,40],[100,75],[170,45]],"w":4,"c":"#1a73e8","close":false}]}' >/dev/null
curl --fail-with-body --silent --show-error "$API/sheet/$SHEET/ops?since=0" | grep -q '"path"'
PIXEL='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL3VwAAAABJRU5ErkJggg=='
curl --fail-with-body --silent --show-error -X POST "$API/sheet/$SHEET/png" -H 'content-type: application/json' \
  -d "{\"data_url\":\"data:image/png;base64,$PIXEL\"}" | grep -q '"ok":true'
curl --fail-with-body --silent --show-error --location "$API/sheet/$SHEET/png?fresh=1" >/dev/null

printf '== memory, search, files/media lists and stats ==\n'
curl --fail-with-body --silent --show-error "$API/memory?session_id=$SID" | grep -q '"memory"'
curl --fail-with-body --silent --show-error "$API/files?session_id=$SID" | grep -q '"files"'
curl --fail-with-body --silent --show-error "$API/media?session_id=$SID" | grep -q '"media"'
curl --fail-with-body --silent --show-error "$API/stats" | grep -q '"scorecards"'

printf 'Smoke test passed for session %s.\n' "$SID"
