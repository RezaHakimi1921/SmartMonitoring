#!/bin/bash
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
cd /var/www/monitoring

TOKEN="$(node <<'NODE'
const fs = require('fs')
const crypto = require('crypto')
const path = 'data/users.json'
const store = JSON.parse(fs.readFileSync(path, 'utf8'))
const admin = store.users.find((u) => u.username === 'admin')
const token = crypto.randomBytes(32).toString('hex')
store.sessions = (store.sessions || []).filter((s) => s.expiresAt > Date.now())
store.sessions.push({
  token,
  userId: admin.id,
  expiresAt: Date.now() + 60 * 60 * 1000,
})
fs.writeFileSync(path, JSON.stringify(store, null, 2))
process.stdout.write(token)
NODE
)"

CODE="$(curl -sS -o /tmp/mon-me.json -w '%{http_code}' -H "Cookie: sx_monitoring_session=$TOKEN" http://127.0.0.1:5188/monitoring/api/auth/me)"
echo "auth_me_http=$CODE"
node -e 'const j=JSON.parse(require("fs").readFileSync("/tmp/mon-me.json","utf8")); console.log("user", j.user && j.user.username, j.user && j.user.role)'

curl -sS -o /tmp/mon-pc.json -w 'panel_http=%{http_code}\n' -H "Cookie: sx_monitoring_session=$TOKEN" \
  'http://127.0.0.1:5188/monitoring/api/report/section?branchId=7220&feature=panelCharge&from=1405/07/17&to=1405/08/17'
node -e 'const j=JSON.parse(require("fs").readFileSync("/tmp/mon-pc.json","utf8")); const m=(j.section&&j.section.metrics)||[]; console.log("panel", m.map(x=>x.label+":"+x.value+":"+(x.note||"")).join(" | "))'

# invalidate short smoke session
SMOKE_TOKEN="$TOKEN" node <<'NODE'
const fs = require('fs')
const path = 'data/users.json'
const store = JSON.parse(fs.readFileSync(path, 'utf8'))
store.sessions = (store.sessions || []).filter(
  (s) => s.token !== process.env.SMOKE_TOKEN,
)
fs.writeFileSync(path, JSON.stringify(store, null, 2))
NODE

rm -f /tmp/mon-me.json /tmp/mon-pc.json
unset TOKEN
