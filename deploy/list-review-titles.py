import json
p = "/var/www/monitoring/data/monitoring-config.json"
c = json.load(open(p, encoding="utf-8"))
for t in c.get("reviewTypes", []):
    print(t["id"], "|", t["title"])
