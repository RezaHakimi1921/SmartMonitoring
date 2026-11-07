import json
import urllib.request
import http.cookiejar

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
req = urllib.request.Request(
    "http://127.0.0.1:5188/monitoring/api/auth/login",
    data=json.dumps({"username": "admin", "password": "ChangeMe!234"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
print("login", opener.open(req).read().decode()[:160])
for feature in ("subscription", "balance", "overall", "survey"):
    url = (
        "http://127.0.0.1:5188/monitoring/api/report/section"
        f"?branchId=17297&feature={feature}&from=1404/09/01&to=1405/08/12"
    )
    raw = opener.open(url).read().decode()
    data = json.loads(raw)
    section = data.get("section") or {}
    metrics = section.get("metrics") or []
    print("---", feature, "---")
    for m in metrics[:6]:
        print(f"  {m.get('label')}: {m.get('value')} [{m.get('tone')}]")
    for h in (section.get("hints") or [])[:3]:
        print(f"  hint: {h.get('text')} [{h.get('tone')}]")
