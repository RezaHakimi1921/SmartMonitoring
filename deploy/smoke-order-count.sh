#!/bin/bash
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
cd /var/www/monitoring
TOKEN="$(node <<'NODE'
const fs=require('fs'); const crypto=require('crypto');
const path='data/users.json';
const store=JSON.parse(fs.readFileSync(path,'utf8'));
const admin=store.users.find(u=>u.username==='admin');
const token=crypto.randomBytes(32).toString('hex');
store.sessions=(store.sessions||[]).filter(s=>s.expiresAt>Date.now());
store.sessions.push({token,userId:admin.id,expiresAt:Date.now()+30*60*1000});
fs.writeFileSync(path,JSON.stringify(store,null,2));
process.stdout.write(token);
NODE
)"
curl -sS -H "Cookie: sx_monitoring_session=$TOKEN" \
  'http://127.0.0.1:5188/monitoring/api/report/section?branchId=7220&feature=overall&from=1404/08/17&to=1405/08/17' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d); const m=(j.section&&j.section.metrics)||[]; console.log(m.map(x=>x.label+"="+x.value+" | "+(x.note||"")).join("\n"))})'
curl -sS -H "Cookie: sx_monitoring_session=$TOKEN" \
  'http://127.0.0.1:5188/monitoring/api/feedback/ca51967b-cec7-40ef-9b0b-c4b069da7cda' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d); console.log("status",j.item.status); for (const c of j.item.comments) console.log(c.visibility, (c.body||"").slice(0,60).replace(/\n/g," "))})'
SMOKE_TOKEN="$TOKEN" node <<'NODE'
const fs=require('fs'); const path='data/users.json';
const store=JSON.parse(fs.readFileSync(path,'utf8'));
store.sessions=(store.sessions||[]).filter(s=>s.token!==process.env.SMOKE_TOKEN);
fs.writeFileSync(path,JSON.stringify(store,null,2));
NODE
