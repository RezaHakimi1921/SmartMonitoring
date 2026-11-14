#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck disable=SC1091
. "${NVM_DIR}/nvm.sh"
nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
cd /var/www/monitoring
mkdir -p logs
pkill -f 'tsx server/prod.ts' 2>/dev/null || true
pkill -f 'server/prod.ts' 2>/dev/null || true
sleep 1
NODE_BIN="$(command -v node)"
TSX_BIN="$(command -v tsx || true)"
if [ -z "${TSX_BIN}" ] && [ -x node_modules/.bin/tsx ]; then
  TSX_BIN="$(pwd)/node_modules/.bin/tsx"
fi
echo "NODE=${NODE_BIN}"
echo "TSX=${TSX_BIN}"
nohup "${TSX_BIN}" server/prod.ts >> logs/out.log 2>&1 &
echo $! > logs/monitoring.pid
sleep 2
curl -sS http://127.0.0.1:5188/monitoring/api/health
echo
if grep -R -F -q 'BrandName@' dist/assets/*.js 2>/dev/null \
  && grep -R -F -q 'IRANYekanXFaNum' dist/assets/*.css 2>/dev/null; then
  echo HAS_DS_UI
else
  echo MISSING_DS_UI
fi
echo PID="$(cat logs/monitoring.pid)"
ps -p "$(cat logs/monitoring.pid)" -o pid,cmd || true
