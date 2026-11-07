#!/usr/bin/env bash
set -euo pipefail
BASE=http://127.0.0.1:5188/monitoring
JAR=/tmp/mc.jar
rm -f "$JAR"

echo "== health =="
curl -sS "$BASE/api/health"
echo

echo "== login =="
curl -sS -c "$JAR" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"ChangeMe!234"}' \
  "$BASE/api/auth/login"
echo

echo "== me =="
curl -sS -c "$JAR" -b "$JAR" "$BASE/api/auth/me"
echo

echo "== users =="
curl -sS -c "$JAR" -b "$JAR" "$BASE/api/users"
echo

echo "== create operator =="
curl -sS -c "$JAR" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d '{"username":"operator1","displayName":"اپراتور یک","role":"operator","password":"OpPass!234"}' \
  "$BASE/api/users"
echo

echo "== users again =="
curl -sS -c "$JAR" -b "$JAR" "$BASE/api/users"
echo

echo "== static =="
curl -sS -o /dev/null -w "index:%{http_code}\n" "$BASE/"
