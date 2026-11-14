#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mark technical feedback comments as admin-only; ensure a clear public note on fixed tickets."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

FB = Path("/var/www/monitoring/data/feedback.json")
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

TECH_RE = re.compile(
    r"("
    r"Fact_|HowMany|MinFacture|TotalOrders|SmartPowerBI|SmartProjectDW|"
    r"DateKey|YearMonth|overflow|Card|hints|sw\s*=|"
    r"aggregate_|V_BI_|sql|SQL|API|/metric|"
    r"دیپلوی|۱۹۶|کاتالوگ|کانفیگ|بررسی فنی|"
    r"نیاز به تصمیم|\[ادمین\]"
    r")",
    re.I,
)

# Simple public explanations for tickets we already fixed (if missing)
PUBLIC_DONE = {
    "9033231e-0b8a-40a5-ac9e-12e3644f94d5": (
        "انجام شد.\nعنوان به «بررسی پس از تحویل» تغییر کرد."
    ),
    "4df3a52f-ff2b-4973-a517-baa5d0882701": (
        "انجام شد.\nمشکل نمایش جدول تاریخ در بازه دلخواه برطرف شد؛ الان روزها دیده می‌شوند."
    ),
    "c7cdace2-b219-4aec-93f4-89f74764effe": (
        "انجام شد.\nقطع ارتباط و شارژ پنل از هم جدا هستند. "
        "عدد قطع مربوط به بازه انتخابی است؛ اگر شارژ کم باشد در نکات قابل‌بهبود هم دیده می‌شود."
    ),
}

actor = {
    "userId": "system-fix",
    "username": "onyx",
    "displayName": "پشتیبانی دیدبان",
}

store = json.loads(FB.read_text(encoding="utf-8"))
changed = 0
added_public = 0

for item in store.get("items", []):
    for c in item.get("comments") or []:
        body = c.get("body") or ""
        who = f"{c.get('displayName') or ''} {c.get('username') or ''}"
        already = c.get("visibility") == "admin"
        tech = bool(TECH_RE.search(body)) or any(
            x in who for x in ("بررسی Onyx", "اصلاح خودکار")
        )
        # Keep already-good plain public support notes public
        if tech and not already:
            # Exception: short plain public notes from پشتیبانی that aren't technical
            if (
                "پشتیبانی دیدبان" in who
                and not TECH_RE.search(body)
                and "بررسی شد" in body
            ):
                c["visibility"] = "public"
                continue
            c["visibility"] = "admin"
            changed += 1
            print("adminize", item["id"][:8], body[:50].replace("\n", " "))
        elif already:
            c["visibility"] = "admin"
        else:
            c.setdefault("visibility", "public")

    tid = item.get("id")
    if tid in PUBLIC_DONE and item.get("status") == "done":
        publics = [
            c
            for c in (item.get("comments") or [])
            if c.get("visibility") != "admin"
        ]
        # If no non-admin comment left that explains resolution, add one
        has_clear = any(
            ("انجام شد" in (c.get("body") or ""))
            or ("بررسی شد" in (c.get("body") or ""))
            or ("برطرف" in (c.get("body") or ""))
            or ("یکی شده" in (c.get("body") or ""))
            for c in publics
        )
        if not has_clear:
            body = PUBLIC_DONE[tid]
            item.setdefault("comments", []).append(
                {
                    "id": str(uuid4()),
                    "at": now,
                    "userId": actor["userId"],
                    "username": actor["username"],
                    "displayName": actor["displayName"],
                    "body": body,
                    "visibility": "public",
                }
            )
            item["updatedAt"] = now
            added_public += 1
            print("public+", tid[:8])

FB.write_text(json.dumps(store, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("changed_to_admin", changed, "added_public", added_public)
